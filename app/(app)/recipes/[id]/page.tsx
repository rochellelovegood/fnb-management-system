'use client';

import { useEffect, useState } from 'react';

interface Ingredient {
  id: string;
  quantity_needed: number;
  unit_of_measure: string;
  wastage_factor: number;
  ingredients: {
    name: string;
    code: string;
    unit_of_measure: string;
  };
}

interface Recipe {
  id: string;
  version: number;
  yield: number;
  production_time_minutes: number;
  instructions: string;
  finished_products: {
    name: string;
    sku: string;
    yield_per_batch: number;
    shelf_life_days: number;
  };
  ingredients: Ingredient[];
}

export default function RecipeDetailPage() {
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [recipeId, setRecipeId] = useState<string | null>(null);

  useEffect(() => {
    // Get the ID from the URL path
    const path = window.location.pathname;
    const id = path.split('/').pop();
    
    console.log('URL Path:', path);
    console.log('Extracted ID:', id);
    
    if (id && id !== 'recipes') {
      setRecipeId(id);
      fetchRecipe(id);
    } else {
      setError('No recipe ID in URL');
      setLoading(false);
    }
  }, []);

  const fetchRecipe = async (id: string) => {
    try {
      console.log('Fetching recipe with ID:', id);
      const response = await fetch(`/api/recipes/${id}`);
      const data = await response.json();
      console.log('API Response:', data);
      
      if (data.success) {
        setRecipe(data.recipe);
      } else {
        setError(data.error || 'Recipe not found');
      }
    } catch (err) {
      setError('Failed to fetch recipe');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold">Loading recipe...</h1>
        {recipeId && <p className="text-gray-600 mt-2">Recipe ID: {recipeId}</p>}
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold text-red-600">Error: {error}</h1>
        <p className="mt-2 text-gray-600">Recipe ID attempted: {recipeId || 'none'}</p>
        <button 
          onClick={() => window.location.href = '/recipes'}
          className="mt-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Back to Recipes
        </button>
      </div>
    );
  }

  if (!recipe) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold">Recipe not found</h1>
        <button 
          onClick={() => window.location.href = '/recipes'}
          className="mt-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Back to Recipes
        </button>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <button 
        onClick={() => window.location.href = '/recipes'}
        className="mb-4 text-blue-600 hover:text-blue-800"
      >
        ← Back to Recipes
      </button>
      
      <h1 className="text-3xl font-bold mb-2">{recipe.finished_products.name}</h1>
      <p className="text-gray-600 mb-6">SKU: {recipe.finished_products.sku}</p>
      
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <div className="border rounded-lg p-4">
          <h2 className="text-xl font-semibold mb-3">Recipe Details</h2>
          <div className="space-y-2">
            <p><span className="font-medium">Version:</span> {recipe.version}</p>
            <p><span className="font-medium">Yield:</span> {recipe.yield}%</p>
            <p><span className="font-medium">Production Time:</span> {recipe.production_time_minutes} minutes</p>
            <p><span className="font-medium">Target Batch Yield:</span> {recipe.finished_products.yield_per_batch}%</p>
            <p><span className="font-medium">Shelf Life:</span> {recipe.finished_products.shelf_life_days} days</p>
          </div>
        </div>
        
        <div className="border rounded-lg p-4">
          <h2 className="text-xl font-semibold mb-3">Instructions</h2>
          <pre className="whitespace-pre-wrap text-sm">{recipe.instructions}</pre>
        </div>
      </div>
      
      <div className="border rounded-lg p-4">
        <h2 className="text-xl font-semibold mb-3">Ingredients</h2>
        {!recipe.ingredients || recipe.ingredients.length === 0 ? (
          <p className="text-gray-500">No ingredients found for this recipe.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Ingredient</th>
                  <th className="text-left py-2">Quantity</th>
                  <th className="text-left py-2">Unit</th>
                  <th className="text-left py-2">Wastage Factor</th>
                </tr>
              </thead>
              <tbody>
                {recipe.ingredients.map((item) => (
                  <tr key={item.id} className="border-b">
                    <td className="py-2 font-medium">{item.ingredients.name}</td>
                    <td className="py-2">{item.quantity_needed}</td>
                    <td className="py-2">{item.unit_of_measure}</td>
                    <td className="py-2">{Math.round(item.wastage_factor * 100)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}