'use client';

import { useEffect, useState } from 'react';

interface Recipe {
  id: string;
  version: number;
  yield: number;
  production_time_minutes: number;
  finished_products: {
    name: string;
    sku: string;
  };
}

export default function RecipesPage() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/recipes')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setRecipes(data.recipes);
        } else {
          setError(data.error);
        }
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="p-8">Loading recipes...</div>;
  }

  if (error) {
    return <div className="p-8 text-red-600">Error: {error}</div>;
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Recipes</h1>
      <div className="grid gap-4">
        {recipes.map((recipe) => (
          <div 
            key={recipe.id} 
            className="border rounded-lg p-4 hover:shadow-md cursor-pointer transition"
            onClick={() => window.location.href = `/recipes/${recipe.id}`}
          >
            <h2 className="text-xl font-semibold">{recipe.finished_products.name}</h2>
            <p className="text-gray-600">SKU: {recipe.finished_products.sku}</p>
            <div className="grid grid-cols-2 gap-4 mt-2 text-sm">
              <div>
                <span className="font-medium">Version:</span> {recipe.version}
              </div>
              <div>
                <span className="font-medium">Yield:</span> {recipe.yield}%
              </div>
              <div>
                <span className="font-medium">Production Time:</span> {recipe.production_time_minutes} minutes
              </div>
            </div>
            <p className="text-blue-600 text-sm mt-2">Click to view details →</p>
          </div>
        ))}
      </div>
    </div>
  );
}