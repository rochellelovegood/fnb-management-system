'use client';

import { useEffect, useState } from 'react';

export default function TestRecipePage() {
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Test with one specific recipe ID from your database
    const recipeId = '3d97b1a9-9430-4af1-87f7-288db962ab17';
    
    fetch(`/api/recipes/${recipeId}`)
      .then(async res => {
        const text = await res.text();
        console.log('Raw response:', text);
        
        try {
          const json = JSON.parse(text);
          setData(json);
        } catch (e) {
          setError(`Invalid JSON: ${text.substring(0, 200)}`);
        }
      })
      .catch(err => {
        setError(err.message);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="p-8">Loading...</div>;
  if (error) return <div className="p-8 text-red-600">Error: {error}</div>;

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Test Recipe API</h1>
      <pre className="bg-gray-100 p-4 rounded overflow-auto max-h-96">
        {JSON.stringify(data, null, 2)}
      </pre>
    </div>
  );
}