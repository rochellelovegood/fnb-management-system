'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface Recipe {
  id: string;
  finished_product_id: string;
  version: number;
  yield: number;
  production_time_minutes: number;
  finished_products: { name: string; sku: string } | null;
}

export default function RecipesPage() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchRecipes();
  }, []);

  const fetchRecipes = async () => {
    try {
      const { data } = await supabase
        .from('recipes')
        .select('*, finished_products(name, sku)')
        .order('created_at', { ascending: false });

      setRecipes(data || []);
    } catch (error) {
      console.error('Error fetching recipes:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Recipes</h1>
          <p className="text-muted-foreground mt-1">Manage product recipes and formulations</p>
        </div>
        <Button onClick={() => router.push('/recipes/new')}>
          <Plus className="h-4 w-4 mr-2" />
          New Recipe
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Loading recipes...</p>
        </div>
      ) : recipes.length === 0 ? (
        <Card className="p-12 text-center">
          <p className="text-muted-foreground mb-4">No recipes created yet</p>
          <Button onClick={() => router.push('/recipes/new')}>Create First Recipe</Button>
        </Card>
      ) : (
        <div className="grid gap-4">
          {recipes.map((recipe) => (
            <Card key={recipe.id} className="p-6 hover:bg-muted/50 cursor-pointer transition">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-foreground">{recipe.finished_products?.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    SKU: {recipe.finished_products?.sku} • Version {recipe.version}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-foreground">{recipe.yield} units</p>
                  <p className="text-sm text-muted-foreground">{recipe.production_time_minutes} min</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
