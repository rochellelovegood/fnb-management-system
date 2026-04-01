# Recipes & Inventory Enhancement Guide

## Overview
This document describes the new recipe detail viewing and inventory categorization features that allow you to see recipes with all their ingredients, update formulations based on demand, and organize inventory into three categories.

## Features Implemented

### 1. Recipe Detail Pages with Ingredients
**Location:** `/recipes/[id]`

**What You Can Do:**
- Click any recipe from the recipes list to view detailed ingredient formulation
- See all ingredients with exact quantities and wastage factors
- Calculate total ingredient needs including waste (quantity × wastage factor)
- Edit individual ingredient quantities and wastage factors
- View production time, yield, instructions, and notes

**How to Use:**
1. Go to **Recipes** in the sidebar
2. Click on any recipe card
3. Scroll to see all ingredients
4. Click **Edit** (pencil icon) next to an ingredient
5. Update quantity and wastage factor
6. Click **Save**

**Ingredient Information Displayed:**
- Ingredient name and code
- Required quantity (base amount)
- Wastage/loss factor (e.g., 1.1 = 10% loss)
- Total needed (quantity × wastage factor)
- Unit of measure

---

### 2. Categorized Inventory Management
**Location:** `/inventory/categorized`

**Three Inventory Categories:**

#### Raw Materials (Ingredients)
- Food ingredients and production materials
- Tracked with batch numbers and expiry dates
- Shows FIFO (First In First Out) batches
- Low stock warnings when quantity ≤ reorder point
- Supplier information displayed
- Storage location tracking

#### Packaging Materials
- Bottles (plastic, glass)
- Containers and boxes
- Labels and wrapping
- Tracked separately from ingredients
- Includes packaging type field
- Cost tracking per unit

#### Finished Goods Products
- Ready-to-sell completed products
- Production batch tracking
- Shows production status (planned, in-progress, completed, packaged)
- Links to production batches
- Inventory levels by batch

**How to Use:**
1. Go to **Inventory (Categorized)** in the sidebar
2. Click the tab for the category you want to view
3. See inventory items organized by category
4. Click **Add New** to create items in current category
5. Low stock items show a warning indicator

---

### 3. Demand-Based Ingredient Adjustment
You can now update ingredient quantities in recipes based on anticipated demand:

**How Demand Affects Recipes:**
- In Demand Management, you set seasonal multipliers (1.2x for peak season)
- System calculates expected production volume
- MRP can suggest ingredient quantity adjustments
- One-click "Auto-Update" to apply demand-based changes

**Manual Adjustment:**
1. Go to recipe detail page
2. Click Edit on an ingredient
3. Adjust quantity based on demand forecast
4. Save the changes

**Database Fields Updated:**
- `quantity_needed` - Base ingredient requirement
- `wastage_factor` - Production loss factor (prep, spillage)
- `total_needed` = quantity × wastage_factor

---

## Database Schema Updates

### New Tables

**packaging_inventory**
```
- id (UUID)
- code (TEXT, unique)
- name (TEXT)
- packaging_type (TEXT) - e.g., "bottle", "container", "box"
- unit_of_measure (TEXT)
- quantity_on_hand (DECIMAL)
- reorder_point (DECIMAL)
- unit_cost (DECIMAL)
- supplier_id (UUID FK)
- created_at, updated_at
```

**packaging_batches**
```
- id (UUID)
- packaging_id (UUID FK)
- batch_number (TEXT, unique)
- quantity (DECIMAL)
- received_date (DATE)
- expiry_date (DATE)
- storage_location (TEXT)
- created_at, updated_at
```

### Modified Tables

**ingredients**
- Added `category` field: 'ingredient' | 'packaging' | 'finished_good'

---

## API Endpoints

### Get Recipe with Ingredients
```
GET /api/recipes/[id]
Response: {
  recipe: { /* full recipe data */ },
  ingredients: [ /* array of ingredients with details */ ]
}
```

### Get Inventory by Category
```
GET /api/inventory/by-category?category=ingredient|packaging|finished_good
Response: {
  inventory: [ /* items in category */ ],
  category: "ingredient"
}
```

### Get Packaging Inventory
```
GET /api/packaging-inventory
Response: {
  packaging: [ /* all packaging items with batches */ ]
}
```

### Create Packaging Item
```
POST /api/packaging-inventory
Body: {
  code, name, packaging_type, unit_of_measure, supplier_id, 
  quantity_on_hand, reorder_point, unit_cost
}
```

### Update Recipe Ingredients
```
PUT /api/recipes/update-ingredients
Body: {
  recipeIngredientId,
  quantityNeeded,
  wasteageFactor
}
```

---

## Setup Instructions

### 1. Run Database Migration
Execute this SQL in Supabase SQL Editor:
```sql
-- Copy contents of /scripts/11_inventory_categories.sql
```

### 2. Initialize Packaging Inventory
Add your packaging materials through the app or API

### 3. Update Sample Data
Add category field to existing ingredients

---

## Usage Workflows

### Workflow 1: View and Edit Recipe Formulation
1. Go to **Recipes** page
2. Click recipe to view
3. Edit ingredient quantities as needed
4. Save changes

### Workflow 2: Track Inventory by Category
1. Go to **Inventory (Categorized)**
2. Switch between tabs: Ingredients, Packaging, Finished Goods
3. See stock levels, batches, and expiry dates
4. Identify low stock items (warning badge)

### Workflow 3: Adjust for Seasonal Demand
1. Set seasonal demand factors in **Demand Management**
2. Update ingredient requirements in recipe
3. MRP system will calculate exact ingredient needs
4. Purchase orders generated automatically

---

## Tips & Best Practices

1. **Ingredient Wastage Factor**
   - Set to 1.0 for no waste
   - Use 1.05-1.15 for typical food prep
   - Adjust based on your actual waste data

2. **Batch Tracking**
   - Always assign batch numbers
   - Use FIFO ordering for perishables
   - Track expiry dates accurately

3. **Low Stock Alerts**
   - Set reorder points to cover lead time
   - Monitor regularly for stockouts
   - Consider seasonal variations

4. **Packaging Organization**
   - Create separate entries for each type (bottles, boxes, etc.)
   - Track supplier-specific packaging
   - Monitor packaging costs

---

## Troubleshooting

**Issue: Recipe ingredients not showing**
- Solution: Check that recipe_ingredients table has data
- Verify ingredient_ids reference valid ingredients

**Issue: Low stock warning not appearing**
- Solution: Ensure quantity_on_hand and reorder_point are set
- Check that quantity_on_hand <= reorder_point

**Issue: Packaging inventory not visible**
- Solution: Verify packaging_inventory records exist
- Check that supplier_id (if used) references valid suppliers

---

## Next Steps

1. Populate sample packaging materials
2. Add category field to existing ingredients
3. Set wastage factors for all recipes
4. Configure reorder points based on lead times
5. Integrate with demand management for auto-adjustment
