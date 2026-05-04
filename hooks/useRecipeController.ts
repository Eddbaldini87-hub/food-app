import { useMemo, useRef, useState, type FormEvent } from "react";
import {
  defaultRecipeForm,
} from "../lib/gpPoliceConstants";
import {
  safeNumber,
  roundTo,
  formatCurrency,
  baseUnitFromSizeUnit,
  normalizeRecipeYieldUnitForMath,
  getIngredientDerivedValues,
  getRecipeCostPerBaseUnit,
  buildComponentDetail,
  formatDisplayCostPerUnit,
  getIngredientSummaryDisplay,
  getCompatibleUnitsForBase,
} from "../lib/gpPoliceHelpers";
import {
  importedRecipeUnitOptions,
  normalizeImportedRecipeType,
  normalizeImportedUnitForComponent,
  buildImportedRecipeDraftFromText,
} from "../lib/recipeImportParsing";

type UseRecipeControllerArgs = {
  supplierIngredients: any[];
  recipes: any[];
  setRecipes: (value: any) => void;
  orderingMeta: Record<string, any>;
  createEmergencyBackupSnapshot: (reason?: string) => void;
  setActiveView: (value: string) => void;
};

export function useRecipeController(args: UseRecipeControllerArgs) {
  const {
    supplierIngredients,
    recipes,
    setRecipes,
    orderingMeta,
    createEmergencyBackupSnapshot,
    setActiveView,
  } = args;

  const [recipeForm, setRecipeForm] = useState<any>(defaultRecipeForm);
  const [recipeSearchTerm, setRecipeSearchTerm] = useState("");
  const [recipeTypeFilter, setRecipeTypeFilter] = useState("all");
  const [recipeFolderView, setRecipeFolderView] = useState<any>(null);
  const [recipeIngredientSearch, setRecipeIngredientSearch] = useState("");
  const recipeIngredientSearchRef = useRef<HTMLInputElement | null>(null);
  const recipeImportFileInputRef = useRef<HTMLInputElement | null>(null);
  const [selectedRecipeId, setSelectedRecipeId] = useState<string | null>(null);
  const [selectedRecipeView, setSelectedRecipeView] = useState<"detail" | "prepSheet">("detail");
  const [recipeImportText, setRecipeImportText] = useState("");
  const [recipeImportMessage, setRecipeImportMessage] = useState("");
  const [importedRecipeDraft, setImportedRecipeDraft] = useState<any>(null);

  const ingredientLookup = useMemo(() => {
    return supplierIngredients.reduce((accumulator: any, ingredient: any) => {
      const derived = getIngredientDerivedValues(ingredient);
      accumulator[ingredient.id] = {
        ...ingredient,
        ...derived,
      };
      return accumulator;
    }, {});
  }, [supplierIngredients]);

  const computedRecipes = useMemo(() => {
    const recipeMap: Record<string, any> = {};
    const baseRecipes = recipes.map((recipe) => ({
      ...recipe,
      components: Array.isArray(recipe.components) ? recipe.components : [],
    }));

    const computeRecipe = (recipeId: string, stack: string[] = []) => {
      if (recipeMap[recipeId]) return recipeMap[recipeId];

      const recipe = baseRecipes.find((item: any) => item.id === recipeId);
      if (!recipe) return null;

      if (stack.includes(recipeId)) {
        return {
          ...recipe,
          baseUnit: baseUnitFromSizeUnit(normalizeRecipeYieldUnitForMath(recipe.yieldUnit)),
          totalCost: 0,
          costPerBaseUnit: 0,
          costPerPortion: 0,
          portionsPerBatch: 0,
          foodCostPercent: 0,
          grossProfitAmount: 0,
          grossProfitPercent: 0,
          componentDetails: [],
        };
      }

      const componentDetails = recipe.components.map((component: any) => {
        if (component.componentType === "supplier") {
          return buildComponentDetail(component, ingredientLookup, {});
        }

        const linkedRecipe = computeRecipe(component.linkedId, [...stack, recipeId]);
        return buildComponentDetail(
          component,
          ingredientLookup,
          linkedRecipe ? { [component.linkedId]: linkedRecipe } : {}
        );
      });

      const totalCost = componentDetails.reduce((sum: number, item: any) => sum + safeNumber(item.lineCost), 0);
      const isFinalDish = recipe.recipeType === "final dish";
      const recipeBaseValues = isFinalDish
        ? { baseUnit: "each", costPerBaseUnit: totalCost }
        : getRecipeCostPerBaseUnit({
            totalCost,
            yieldAmount: recipe.yieldAmount,
            yieldUnit: recipe.yieldUnit,
          });
      const baseUnit = recipeBaseValues.baseUnit;
      const costPerBaseUnit = recipeBaseValues.costPerBaseUnit;
      const portionsPerBatch = isFinalDish ? 1 : 0;
      const costPerPortion = isFinalDish ? totalCost : 0;

      const sellPrice = safeNumber(recipe.sellPrice);
      const foodCostPercent = sellPrice > 0 ? (costPerPortion / sellPrice) * 100 : 0;
      const grossProfitAmount = sellPrice - costPerPortion;
      const grossProfitPercent = sellPrice > 0 ? (grossProfitAmount / sellPrice) * 100 : 0;

      const computed = {
        ...recipe,
        baseUnit,
        totalCost,
        costPerBaseUnit,
        componentDetails,
        portionsPerBatch,
        costPerPortion,
        foodCostPercent,
        grossProfitAmount,
        grossProfitPercent,
      };

      recipeMap[recipeId] = computed;
      return computed;
    };

    return baseRecipes.map((recipe) => computeRecipe(recipe.id)).filter(Boolean);
  }, [recipes, ingredientLookup]);

  const computedRecipeLookup = useMemo(() => {
    return computedRecipes.reduce((accumulator: any, recipe: any) => {
      accumulator[recipe.id] = recipe;
      return accumulator;
    }, {});
  }, [computedRecipes]);

  const filteredRecipes = useMemo(() => {
    const search = recipeSearchTerm.trim().toLowerCase();

    return computedRecipes.filter((recipe: any) => {
      const matchesFilter = recipeTypeFilter === "all" ? true : recipe.recipeType === recipeTypeFilter;

      if (!matchesFilter) {
        return false;
      }

      if (!search) {
        return true;
      }

      const searchableText = [recipe.name, recipe.recipeType, recipe.category]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchableText.includes(search);
    });
  }, [computedRecipes, recipeSearchTerm, recipeTypeFilter]);

  const selectedRecipe = selectedRecipeId ? computedRecipeLookup[selectedRecipeId] : null;

  const recipeFolderOptions = [
    {
      key: "all",
      label: "Total Recipes",
      helper: "Every recipe in the folder. No hiding from the numbers now.",
      getRecipes: () => computedRecipes,
    },
    {
      key: "ingredient-prep",
      label: "Ingredient Prep",
      helper: "Prep recipes only. The mise en place evidence locker.",
      getRecipes: () => computedRecipes.filter((recipe: any) => recipe.recipeType === "ingredient prep"),
    },
    {
      key: "batch-recipes",
      label: "Batch Recipes",
      helper: "Batch recipes only. Sauces, bases, and all the margin building blocks.",
      getRecipes: () => computedRecipes.filter((recipe: any) => recipe.recipeType === "batch recipe"),
    },
    {
      key: "final-dishes",
      label: "Final Dishes",
      helper: "Final dishes only. This is where the GP either behaves or gets arrested.",
      getRecipes: () => computedRecipes.filter((recipe: any) => recipe.recipeType === "final dish"),
    },
    {
      key: "missing-category",
      label: "Missing Category",
      helper: "Recipes with no category. Bit hard to sort the evidence if the folder is blank.",
      getRecipes: () => computedRecipes.filter((recipe: any) => !String(recipe.category || "").trim()),
    },
    {
      key: "no-components",
      label: "No Components",
      helper: "Recipes with no ingredient lines. That's not costing, that's wishful thinking.",
      getRecipes: () => computedRecipes.filter((recipe: any) => !Array.isArray(recipe.components) || recipe.components.length === 0),
    },
    {
      key: "no-sell-price",
      label: "No Sell Price",
      helper: "Final dishes with no sell price. Lovely way to donate margin if no one fixes it.",
      getRecipes: () => computedRecipes.filter((recipe: any) => recipe.recipeType === "final dish" && safeNumber(recipe.sellPrice) <= 0),
    },
  ];

  const currentRecipeFolder = recipeFolderView
    ? recipeFolderOptions.find((folder) => folder.key === recipeFolderView)
    : null;

  const quickAddIngredientMatches = useMemo(() => {
    const search = recipeIngredientSearch.trim().toLowerCase();
    if (!search) return [];

    return supplierIngredients
      .filter((ingredient: any) => {
        const supplierName = String(ingredient.supplierName || orderingMeta[ingredient.id]?.supplierName || "").trim();
        const haystack = [ingredient.name, supplierName].filter(Boolean).join(" ").toLowerCase();
        return haystack.includes(search);
      })
      .sort((a: any, b: any) => String(a.name || "").localeCompare(String(b.name || "")))
      .slice(0, 10);
  }, [orderingMeta, recipeIngredientSearch, supplierIngredients]);


  const handleRecipeFormChange = (field: string, value: any) => {
    setRecipeForm((previous: any) => ({
      ...previous,
      [field]: value,
    }));
  };

  const clearRecipeForm = () => {
    const hasContent =
      recipeForm.name ||
      recipeForm.category ||
      recipeForm.yieldAmount ||
      recipeForm.portionSize ||
      recipeForm.sellPrice ||
      recipeForm.components.length > 0;

    if (hasContent) {
      const confirmed = window.confirm("Clear this recipe form? All that hard work in the bin?");
      if (!confirmed) return;
    }

    setRecipeForm(defaultRecipeForm);
  };

  const clearImportedRecipeReview = () => {
    setRecipeImportText("");
    setImportedRecipeDraft(null);
    setRecipeImportMessage("");
    if (recipeImportFileInputRef.current) {
      recipeImportFileInputRef.current.value = "";
    }
  };

  const importRecipeFromText = () => {
    setImportedRecipeDraft(null);
    const draft = buildImportedRecipeDraftFromText(recipeImportText, supplierIngredients, recipeForm.recipeType);

    if (!draft) {
      setRecipeImportMessage("Paste a recipe in first. Even GP Police can't cost thin air.");
      window.alert("Paste a recipe in first. Even GP Police App can't cost thin air.");
      return;
    }

    if (!draft.method && draft.lines.length === 0) {
      setImportedRecipeDraft(null);
      setRecipeImportMessage("Only the recipe name was recognised. Paste title, ingredients, and method on separate lines.");
      window.alert("Only the recipe name was recognised. Paste title, ingredients, and method on separate lines.");
      return;
    }

    const matchedCount = draft.lines.filter((line: any) => line.status === "matched").length;
    const attentionCount = draft.lines.filter((line: any) => line.status !== "matched" && line.status !== "ignored").length;
    setImportedRecipeDraft(draft);
    setRecipeImportMessage(`Recipe imported. ${matchedCount} line${matchedCount === 1 ? "" : "s"} matched, ${attentionCount} need attention. Check the lines below, then save.`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const updateImportedRecipeDraftField = (field: string, value: any) => {
    setImportedRecipeDraft((previous: any) => previous ? { ...previous, [field]: value } : previous);
  };

  const updateImportedRecipeDraftLine = (lineId: string, field: string, value: any) => {
    setImportedRecipeDraft((previous: any) => {
      if (!previous) return previous;
      const lines = previous.lines.map((line: any) => {
        if (line.id !== lineId) return line;

        if (field === "matchedIngredientId") {
          const matchedIngredient = supplierIngredients.find((ingredient: any) => ingredient.id === value);
          return {
            ...line,
            matchedIngredientId: value || null,
            matchedIngredientName: matchedIngredient?.name || null,
            ingredientName: matchedIngredient?.name || line.ingredientName,
            status: value ? (line.quantity ? "matched" : "needs_qty") : "needs_match",
          };
        }

        const nextLine = { ...line, [field]: value };
        if (field === "quantity" || field === "unit" || field === "ingredientName") {
          nextLine.status = nextLine.matchedIngredientId
            ? safeNumber(nextLine.quantity) > 0
              ? "matched"
              : "needs_qty"
            : "needs_match";
        }
        return nextLine;
      });

      return { ...previous, lines };
    });
  };

  const ignoreImportedRecipeDraftLine = (lineId: string) => {
    setImportedRecipeDraft((previous: any) => {
      if (!previous) return previous;
      return {
        ...previous,
        lines: previous.lines.map((line: any) =>
          line.id === lineId ? { ...line, status: line.status === "ignored" ? (line.matchedIngredientId ? "matched" : "needs_match") : "ignored" } : line
        ),
      };
    });
  };

  const importedDraftToRecipeForm = (draft: any) => {
    const recipeType = normalizeImportedRecipeType(draft.type);
    const components = (draft.lines || [])
      .filter((line: any) => line.status !== "ignored")
      .map((line: any) => ({
        id: `component_import_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        componentType: "supplier",
        linkedId: line.matchedIngredientId || "",
        quantity: line.quantity === "" ? "" : safeNumber(line.quantity),
        unit: normalizeImportedUnitForComponent(line.unit),
        section: "Imported",
        importedName: line.ingredientName,
      }));

    return {
      ...defaultRecipeForm,
      name: String(draft.name || "").trim(),
      recipeType,
      category: String(draft.category || "").trim(),
      notes: String(draft.method || "").trim(),
      yieldAmount: recipeType === "final dish" ? "" : draft.yieldAmount,
      yieldUnit: draft.yieldUnit || (recipeType === "final dish" ? "each" : "g"),
      components,
    };
  };

  const editImportedRecipeInFullForm = () => {
    if (!importedRecipeDraft) return;
    setRecipeForm(importedDraftToRecipeForm(importedRecipeDraft));
    setImportedRecipeDraft(null);
    setRecipeImportMessage("Imported recipe moved into the full form. Finish any loose lines, then save.");
    window.setTimeout(() => {
      document.getElementById("recipe-full-form")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 0);
  };

  const saveImportedRecipeDraft = () => {
    if (!importedRecipeDraft) return;

    const draft = importedRecipeDraft;
    const recipeType = normalizeImportedRecipeType(draft.type);
    if (!String(draft.name || "").trim()) {
      setRecipeImportMessage("Recipe name required before saving.");
      return;
    }
    if (recipeType !== "final dish" && safeNumber(draft.yieldAmount) <= 0) {
      setRecipeImportMessage("Yield required before saving this recipe.");
      return;
    }

    const activeLines = (draft.lines || []).filter((line: any) => line.status !== "ignored");
    const unmatchedLines = activeLines.filter((line: any) => !line.matchedIngredientId);
    if (unmatchedLines.length > 0) {
      setRecipeImportMessage(`Match ${unmatchedLines.length} ingredient${unmatchedLines.length === 1 ? "" : "s"} before saving.`);
      return;
    }

    const invalidQtyLines = activeLines.filter((line: any) => safeNumber(line.quantity) <= 0 || !line.unit || line.unit === "to taste");
    if (invalidQtyLines.length > 0) {
      setRecipeImportMessage(`Fix quantity/unit on ${invalidQtyLines.length} line${invalidQtyLines.length === 1 ? "" : "s"} before saving.`);
      return;
    }

    const payload = {
      ...importedDraftToRecipeForm(draft),
      id: `recipe_${Date.now()}`,
      name: String(draft.name || "").trim(),
      category: String(draft.category || "").trim(),
      notes: String(draft.method || "").trim(),
      yieldAmount: recipeType === "final dish" ? 1 : safeNumber(draft.yieldAmount),
      yieldUnit: recipeType === "final dish" ? "each" : draft.yieldUnit,
      portionSize: 0,
      sellPrice: 0,
    };

    createEmergencyBackupSnapshot("save_imported_recipe");

    setRecipes((previous: any) => [...previous, payload]);
    setImportedRecipeDraft(null);
    setRecipeImportText("");
    setRecipeImportMessage("Recipe saved.");
    setActiveView("recipes");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleRecipeImportFileUpload = (file: File | null) => {
    if (!file) return;

    const fileName = String(file.name || "").toLowerCase();
    const resetRecipeImportInput = () => {
      if (recipeImportFileInputRef.current) {
        recipeImportFileInputRef.current.value = "";
      }
    };

    const loadImportedRecipeText = (importedText: string) => {
      const cleanText = String(importedText || "").trim();

      if (!cleanText) {
        const message = "Could not read that recipe file. Try saving as .txt or paste the recipe text.";
        setRecipeImportMessage(message);
        window.alert(message);
        resetRecipeImportInput();
        return;
      }

      setImportedRecipeDraft(null);
      setRecipeImportText(cleanText);
      setRecipeImportMessage("Recipe file loaded. Hit Bring In Recipe Text to review it before saving.");
      resetRecipeImportInput();
    };

    if (fileName.endsWith(".doc") && !fileName.endsWith(".docx")) {
      const message = "Old .doc files are not supported. Save it as .docx or .txt, then import again.";
      setRecipeImportMessage(message);
      window.alert(message);
      resetRecipeImportInput();
      return;
    }

    if (fileName.endsWith(".docx")) {
      const reader = new FileReader();

      reader.onload = async () => {
        try {
          const arrayBuffer = reader.result as ArrayBuffer;
          // @ts-ignore - dynamic Word import dependency is loaded at runtime.
          const mammothModule = await import("mammoth");
          const mammothReader = (mammothModule as any).default || mammothModule;
          const result = await mammothReader.extractRawText({ arrayBuffer });
          loadImportedRecipeText(result.value || "");
        } catch (error) {
          console.error("Could not read Word recipe file", error);
          const message = "Could not read that Word file. Try saving as .txt or paste the recipe text.";
          setRecipeImportMessage(message);
          window.alert(message);
          resetRecipeImportInput();
        }
      };

      reader.onerror = () => {
        const message = "Could not read that Word file. Try saving as .txt or paste the recipe text.";
        setRecipeImportMessage(message);
        window.alert(message);
        resetRecipeImportInput();
      };

      reader.readAsArrayBuffer(file);
      return;
    }

    if (!fileName.endsWith(".txt")) {
      const message = "Upload a .txt or .docx recipe file, or paste the recipe text into the box.";
      setRecipeImportMessage(message);
      window.alert(message);
      resetRecipeImportInput();
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      loadImportedRecipeText(String(reader.result || ""));
    };

    reader.onerror = () => {
      const message = "Could not read that recipe file. Try saving as .txt or paste the recipe text.";
      setRecipeImportMessage(message);
      window.alert(message);
      resetRecipeImportInput();
    };

    reader.readAsText(file);
  };


  const addRecipeComponent = () => {
    setRecipeForm((previous: any) => ({
      ...previous,
      components: [
        ...previous.components,
        {
          id: `component_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
          componentType: "supplier",
          linkedId: "",
          quantity: "",
          unit: "g",
          section: "Main",
        },
      ],
    }));
  };

  const quickAddSupplierIngredientToRecipe = (ingredient: any) => {
    const derived = getIngredientDerivedValues(ingredient);

    setRecipeForm((previous: any) => ({
      ...previous,
      components: [
        ...previous.components,
        {
          id: `component_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
          componentType: "supplier",
          linkedId: ingredient.id,
          quantity: "",
          unit: derived.baseUnit || "g",
          section: "Main",
        },
      ],
    }));

    setRecipeIngredientSearch("");
    window.setTimeout(() => recipeIngredientSearchRef.current?.focus(), 0);
  };

  const updateRecipeComponent = (componentId: string, field: string, value: any) => {
    setRecipeForm((previous: any) => ({
      ...previous,
      components: previous.components.map((component: any) =>
        component.id === componentId ? { ...component, [field]: value } : component
      ),
    }));
  };

  const removeRecipeComponent = (componentId: string) => {
    const confirmed = window.confirm("Remove this component? Hope it wasn't carrying the dish.");
    if (!confirmed) return;

    setRecipeForm((previous: any) => ({
      ...previous,
      components: previous.components.filter((component: any) => component.id !== componentId),
    }));
  };

  const saveRecipe = (event: FormEvent) => {
    event.preventDefault();

    if (!recipeForm.name.trim()) {
      window.alert("Give the recipe a name, mate. We can't cost vibes.");
      return;
    }

    if (recipeForm.recipeType !== "final dish" && safeNumber(recipeForm.yieldAmount) <= 0) {
      window.alert("Put in a real yield. GP Police App needs something to work with.");
      return;
    }

    if (recipeForm.components.length === 0) {
      window.alert("No components? What are we costing here, air?");
      return;
    }


    const normalizedComponents = recipeForm.components.map((component: any) => ({
      ...component,
      quantity: safeNumber(component.quantity),
      section: String(component.section || "Main").trim() || "Main",
    }));

    const invalidComponent = normalizedComponents.find(
      (component: any) => !component.linkedId || safeNumber(component.quantity) <= 0
    );

    if (invalidComponent) {
      window.alert("Finish the component picks and quantities first. Half-built jobs get pinched.");
      return;
    }

    const payload = {
      ...recipeForm,
      id: recipeForm.id || `recipe_${Date.now()}`,
      name: recipeForm.name.trim(),
      category: recipeForm.category.trim(),
      notes: String(recipeForm.notes || "").trim(),
      yieldAmount: recipeForm.recipeType === "final dish" ? safeNumber(recipeForm.yieldAmount) || 1 : safeNumber(recipeForm.yieldAmount),
      yieldUnit: recipeForm.recipeType === "final dish" ? recipeForm.yieldUnit || "each" : recipeForm.yieldUnit,
      portionSize: safeNumber(recipeForm.portionSize),
      sellPrice: safeNumber(recipeForm.sellPrice),
      components: normalizedComponents,
    };

    createEmergencyBackupSnapshot("save_recipe");

    setRecipes((previous: any) => {
      if (recipeForm.id) {
        return previous.map((item: any) => (item.id === recipeForm.id ? payload : item));
      }
      return [...previous, payload];
    });

    setRecipeForm(defaultRecipeForm);
    setSelectedRecipeId(null);
    setActiveView("recipes");
  };

  const openRecipeView = (recipeId: string) => {
    setSelectedRecipeId(recipeId);
    setSelectedRecipeView("detail");
    setActiveView("recipeDetail");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const startNewRecipe = () => {
    setRecipeForm(defaultRecipeForm);
    setSelectedRecipeId(null);
    setActiveView("recipeBuilder");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const editRecipe = (recipeId: string) => {
    const recipe = recipes.find((item: any) => item.id === recipeId);
    if (!recipe) return;

    setRecipeForm({
      id: recipe.id,
      name: recipe.name || "",
      recipeType: recipe.recipeType || "batch recipe",
      category: recipe.category || "",
      notes: recipe.notes || "",
      yieldAmount: recipe.yieldAmount?.toString() || "",
      yieldUnit: recipe.yieldUnit || "g",
      portionSize: recipe.portionSize?.toString() || "",
      portionUnit: recipe.portionUnit || "g",
      sellPrice: recipe.sellPrice?.toString() || "",
      components: Array.isArray(recipe.components)
        ? recipe.components.map((component: any) => ({
            ...component,
            quantity: component.quantity?.toString() || "",
            section: component.section || "Main",
          }))
        : [],
    });

    setActiveView("recipeBuilder");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const deleteRecipe = (recipeId: string) => {
    const linkedRecipesCount = recipes.filter((recipe) =>
      (recipe.components || []).some(
        (component: any) =>
          (component.componentType === "batch" || component.componentType === "prep") &&
          component.linkedId === recipeId
      )
    ).length;

    const message =
      linkedRecipesCount > 0
        ? `This recipe is linked to ${linkedRecipesCount} other recipe(s). Delete it anyway and start a scene?`
        : "Delete this recipe? That's brave.";

    const confirmed = window.confirm(message);
    if (!confirmed) return;

    createEmergencyBackupSnapshot("delete_recipe");

    setRecipes((previous: any) => previous.filter((item: any) => item.id !== recipeId));

    if (recipeForm.id === recipeId) {
      setRecipeForm(defaultRecipeForm);
    }

    if (selectedRecipeId === recipeId) {
      setSelectedRecipeId(null);
      setSelectedRecipeView("detail");
      setActiveView("recipes");
    }
  };

  const recipePreview = useMemo(() => {
    const isFinalDish = recipeForm.recipeType === "final dish";
    const temporaryRecipe = {
      ...recipeForm,
      id: recipeForm.id || "preview_recipe",
      yieldAmount: isFinalDish ? safeNumber(recipeForm.yieldAmount) || 1 : safeNumber(recipeForm.yieldAmount),
      yieldUnit: isFinalDish ? recipeForm.yieldUnit || "each" : recipeForm.yieldUnit,
      portionSize: safeNumber(recipeForm.portionSize),
      sellPrice: safeNumber(recipeForm.sellPrice),
      components: (recipeForm.components || []).map((component: any) => ({
        ...component,
        quantity: safeNumber(component.quantity),
        section: String(component.section || "Main").trim() || "Main",
      })),
    };

    const componentDetails = temporaryRecipe.components.map((component: any) =>
      buildComponentDetail(component, ingredientLookup, computedRecipeLookup)
    );

    const totalCost = componentDetails.reduce((sum: number, item: any) => sum + safeNumber(item.lineCost), 0);
    const recipeBaseValues = isFinalDish
      ? { baseUnit: "each", costPerBaseUnit: totalCost }
      : getRecipeCostPerBaseUnit({
          totalCost,
          yieldAmount: temporaryRecipe.yieldAmount,
          yieldUnit: temporaryRecipe.yieldUnit,
        });
    const baseUnit = recipeBaseValues.baseUnit;
    const costPerBaseUnit = recipeBaseValues.costPerBaseUnit;
    const portionsPerBatch = isFinalDish ? 1 : 0;
    const costPerPortion = isFinalDish ? totalCost : 0;

    const sellPrice = safeNumber(temporaryRecipe.sellPrice);
    const foodCostPercent = sellPrice > 0 ? (costPerPortion / sellPrice) * 100 : 0;
    const grossProfitAmount = sellPrice - costPerPortion;
    const grossProfitPercent = sellPrice > 0 ? (grossProfitAmount / sellPrice) * 100 : 0;
    const targetCogsPercent = 26;
    const targetGpPercent = 74;
    const targetCogsDecimal = targetCogsPercent / 100;
    const recommendedSellPrice = isFinalDish && totalCost > 0 ? totalCost / targetCogsDecimal : 0;
    const isSellPriceBelowRecommendation = isFinalDish && sellPrice > 0 && grossProfitPercent < targetGpPercent;

    return {
      ...temporaryRecipe,
      baseUnit,
      totalCost,
      costPerBaseUnit,
      componentDetails,
      portionsPerBatch,
      costPerPortion,
      foodCostPercent,
      grossProfitAmount,
      grossProfitPercent,
      targetCogsPercent,
      targetGpPercent,
      recommendedSellPrice,
      isSellPriceBelowRecommendation,
    };
  }, [recipeForm, ingredientLookup, computedRecipeLookup]);


  const buildRecipeDownloadText = (recipe: any, mode = "recipe") => {
    const lines = [
      `GP Police ${mode === "prep" ? "Prep Sheet" : "Recipe"}`,
      `Name: ${recipe.name || "Untitled Recipe"}`,
      `Type: ${recipe.recipeType || "Recipe"}`,
      recipe.category ? `Category: ${recipe.category}` : "",
      recipe.recipeType !== "final dish" ? `Yield: ${roundTo(recipe.yieldAmount, 2)} ${recipe.yieldUnit}` : "",
      recipe.recipeType === "final dish" ? `Sell Price: ${formatCurrency(recipe.sellPrice)}` : "",
      recipe.recipeType === "final dish" ? `Food Cost %: ${roundTo(recipe.foodCostPercent, 2)}%` : "",
      recipe.recipeType === "final dish" ? `Gross Profit %: ${roundTo(recipe.grossProfitPercent, 2)}%` : "",
      `Total Cost: ${formatCurrency(recipe.totalCost)}`,
      "",
      "Components:",
      ...(recipe.componentDetails || []).map((component: any) => {
        const unitCost = safeNumber(component.quantity) > 0 ? safeNumber(component.lineCost) / safeNumber(component.quantity) : 0;
        return `- ${component.linkedName || "Unlinked item"}: ${roundTo(component.quantity, 2)} ${component.unit || ""} | Unit Cost ${formatCurrency(unitCost)} | Line Cost ${formatCurrency(component.lineCost)}`;
      }),
      "",
      "Method / Notes:",
      recipe.notes || "",
    ];

    return lines.filter((line) => line !== "").join("\n");
  };

  const downloadRecipeTextFile = (recipe: any, mode = "recipe") => {
    if (!recipe) return;

    const safeName = String(recipe.name || "recipe")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") || "recipe";
    const blob = new Blob([buildRecipeDownloadText(recipe, mode)], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `gp-police-${mode}-${safeName}.txt`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  };




  const finalDishRecipes = useMemo(
    () => computedRecipes.filter((recipe: any) => recipe.recipeType === "final dish"),
    [computedRecipes]
  );

  const recipesWithNoComponents = recipes.filter(
    (recipe: any) => !Array.isArray(recipe.components) || recipe.components.length === 0
  );
  const recipesMissingCategory = recipes.filter((recipe: any) => !String(recipe.category || "").trim());
  const finalDishesWithNoSellPrice = computedRecipes.filter(
    (recipe: any) => recipe.recipeType === "final dish" && safeNumber(recipe.sellPrice) <= 0
  );

  const needsAttentionItems = [
    ...recipesWithNoComponents.map((recipe: any) => ({
      id: `no_components_${recipe.id}`,
      folderKey: "no-components",
      label: `${recipe.name || "Unnamed recipe"} has no components. That's not a recipe, that's a liability.`,
    })),
    ...recipesMissingCategory.map((recipe: any) => ({
      id: `missing_category_${recipe.id}`,
      folderKey: "missing-category",
      label: `${recipe.name || "Unnamed recipe"} is missing a category. Bit hard to sort the evidence.`,
    })),
    ...finalDishesWithNoSellPrice.map((recipe: any) => ({
      id: `missing_sell_price_${recipe.id}`,
      folderKey: "no-sell-price",
      label: `${recipe.name || "Unnamed final dish"} has no sell price. Lovely way to donate margin.`,
    })),
  ];

  return {
    recipeForm,
    setRecipeForm,
    recipeSearchTerm,
    setRecipeSearchTerm,
    recipeTypeFilter,
    setRecipeTypeFilter,
    recipeFolderView,
    setRecipeFolderView,
    recipeIngredientSearch,
    setRecipeIngredientSearch,
    recipeIngredientSearchRef,
    recipeImportFileInputRef,
    selectedRecipeId,
    setSelectedRecipeId,
    selectedRecipeView,
    setSelectedRecipeView,
    recipeImportText,
    setRecipeImportText,
    recipeImportMessage,
    setRecipeImportMessage,
    importedRecipeDraft,
    setImportedRecipeDraft,
    ingredientLookup,
    computedRecipes,
    computedRecipeLookup,
    filteredRecipes,
    selectedRecipe,
    recipeFolderOptions,
    currentRecipeFolder,
    quickAddIngredientMatches,
    finalDishRecipes,
    recipesWithNoComponents,
    recipesMissingCategory,
    finalDishesWithNoSellPrice,
    needsAttentionItems,
    totalRecipeCount: recipes.length,
    totalFinalDishCount: computedRecipes.filter((recipe: any) => recipe.recipeType === "final dish").length,
    mostRecentRecipe: computedRecipes.length > 0 ? computedRecipes[computedRecipes.length - 1] : null,
    housePrepRecipes: computedRecipes.filter((recipe: any) => recipe.recipeType === "ingredient prep"),
    handleRecipeFormChange,
    clearRecipeForm,
    clearImportedRecipeReview,
    importRecipeFromText,
    updateImportedRecipeDraftField,
    updateImportedRecipeDraftLine,
    ignoreImportedRecipeDraftLine,
    importedDraftToRecipeForm,
    editImportedRecipeInFullForm,
    saveImportedRecipeDraft,
    handleRecipeImportFileUpload,
    addRecipeComponent,
    quickAddSupplierIngredientToRecipe,
    updateRecipeComponent,
    removeRecipeComponent,
    saveRecipe,
    openRecipeView,
    startNewRecipe,
    editRecipe,
    deleteRecipe,
    recipePreview,
    buildRecipeDownloadText,
    downloadRecipeTextFile,
    normalizeImportedRecipeType,
    importedRecipeUnitOptions,
    formatDisplayCostPerUnit,
    getIngredientSummaryDisplay,
    getCompatibleUnitsForBase,
    buildComponentDetail,
  };
}
