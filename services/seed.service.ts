import { foodService } from "./food.service";

async function seedFoodData() {
  const foodItems = [
    {
      name: "Margherita Pizza",
      description:
        "Classic pizza with tomato sauce, mozzarella, and fresh basil",
      costPrice: 5.0,
      sellingPrice: 8.5,
      images: [],
      timeEstimate: 12,
      categoryId: "b5cedecc-6831-479a-9695-0d2b22c3d6ae",
      optionGroups: [
        {
          name: "Crust Type",
          required: true,
          multiple: false,
          freeLimit: 0,
          sequence: 1,
          options: [
            { optionName: "Thin Crust", additionalPrice: 0, sequence: 1 },
            { optionName: "Thick Crust", additionalPrice: 0.5, sequence: 2 },
          ],
        },
        {
          name: "Extras",
          required: false,
          multiple: true,
          freeLimit: 1,
          sequence: 2,
          options: [
            { optionName: "Extra Cheese", additionalPrice: 0.5, sequence: 1 },
            { optionName: "Olives", additionalPrice: 0.3, sequence: 2 },
          ],
        },
        {
          name: "Size",
          required: true,
          multiple: false,
          freeLimit: 0,
          sequence: 3,
          options: [
            { optionName: "Medium", additionalPrice: 0, sequence: 1 },
            { optionName: "Large", additionalPrice: 2.0, sequence: 2 },
          ],
        },
      ],
    },
    {
      name: "Spaghetti Carbonara",
      description: "Pasta with creamy egg sauce, pancetta, and parmesan",
      costPrice: 6.0,
      sellingPrice: 9.5,
      images: [],
      timeEstimate: 15,
      categoryId: "b5cedecc-6831-479a-9695-0d2b22c3d6ae",
      optionGroups: [
        {
          name: "Pasta Type",
          required: true,
          multiple: false,
          freeLimit: 0,
          sequence: 1,
          options: [
            { optionName: "Spaghetti", additionalPrice: 0, sequence: 1 },
            { optionName: "Fusilli", additionalPrice: 0, sequence: 2 },
          ],
        },
        {
          name: "Add-ons",
          required: false,
          multiple: true,
          freeLimit: 1,
          sequence: 2,
          options: [
            { optionName: "Extra Pancetta", additionalPrice: 0.8, sequence: 1 },
            { optionName: "Mushrooms", additionalPrice: 0.5, sequence: 2 },
          ],
        },
      ],
    },
    {
      name: "Lasagna Bolognese",
      description: "Layered pasta with meat sauce, béchamel, and mozzarella",
      costPrice: 7.5,
      sellingPrice: 11.0,
      images: [],
      timeEstimate: 20,
      categoryId: "b5cedecc-6831-479a-9695-0d2b22c3d6ae",
      optionGroups: [
        {
          name: "Protein",
          required: true,
          multiple: false,
          freeLimit: 0,
          sequence: 1,
          options: [
            { optionName: "Beef", additionalPrice: 0, sequence: 1 },
            { optionName: "Vegetarian", additionalPrice: 0, sequence: 2 },
          ],
        },
        {
          name: "Portion Size",
          required: true,
          multiple: false,
          freeLimit: 0,
          sequence: 2,
          options: [
            { optionName: "Regular", additionalPrice: 0, sequence: 1 },
            { optionName: "Large", additionalPrice: 2.5, sequence: 2 },
          ],
        },
        {
          name: "Side",
          required: false,
          multiple: false,
          freeLimit: 0,
          sequence: 3,
          options: [
            { optionName: "Garlic Bread", additionalPrice: 1.0, sequence: 1 },
            { optionName: "Caesar Salad", additionalPrice: 1.0, sequence: 2 },
          ],
        },
      ],
    },
    {
      name: "Tiramisu",
      description: "Coffee-flavored dessert with mascarpone and cocoa",
      costPrice: 4.0,
      sellingPrice: 6.5,
      images: [],
      timeEstimate: 8,
      categoryId: "b5cedecc-6831-479a-9695-0d2b22c3d6ae",
      optionGroups: [
        {
          name: "Serving Size",
          required: true,
          multiple: false,
          freeLimit: 0,
          sequence: 1,
          options: [
            { optionName: "Regular", additionalPrice: 0, sequence: 1 },
            { optionName: "Large", additionalPrice: 1.5, sequence: 2 },
          ],
        },
        {
          name: "Topping",
          required: false,
          multiple: true,
          freeLimit: 1,
          sequence: 2,
          options: [
            { optionName: "Extra Cocoa", additionalPrice: 0.3, sequence: 1 },
            { optionName: "Whipped Cream", additionalPrice: 0.5, sequence: 2 },
          ],
        },
      ],
    },
  ];
  console.log("🚀 Starting food data seeding process...");
  console.log(`📊 Total items to create: ${foodItems.length}`);

  for (let i = 0; i < foodItems.length; i++) {
    const foodItem = foodItems[i];
    try {
      console.log(
        `\n🍽️  Creating food item ${i + 1}/${foodItems.length}: ${foodItem.name}`
      );
      console.log(`📝 Description: ${foodItem.description}`);
      console.log(`💰 Cost: ${foodItem.costPrice.toLocaleString("vi-VN")} VND`);
      console.log(
        `💵 Selling Price: ${foodItem.sellingPrice.toLocaleString("vi-VN")} VND`
      );
      console.log(`⏱️  Time Estimate: ${foodItem.timeEstimate} minutes`);
      console.log(`🏷️  Category ID: ${foodItem.categoryId}`);
      console.log(`🔧 Option Groups: ${foodItem.optionGroups.length}`);

      // Log option groups details
      foodItem.optionGroups.forEach((group, groupIndex) => {
        console.log(`   📋 Group ${groupIndex + 1}: ${group.name}`);
        console.log(`      - Required: ${group.required ? "✅" : "❌"}`);
        console.log(`      - Multiple: ${group.multiple ? "✅" : "❌"}`);
        console.log(`      - Free Limit: ${group.freeLimit}`);
        console.log(`      - Options: ${group.options.length}`);
        group.options.forEach((option, optionIndex) => {
          const priceText =
            option.additionalPrice > 0
              ? `(+${option.additionalPrice.toLocaleString("vi-VN")} VND)`
              : "(Free)";
          console.log(
            `         ${optionIndex + 1}. ${option.optionName} ${priceText}`
          );
        });
      });

      // Call the createFood method
      const result = await foodService.createFood(foodItem);

      console.log(`✅ Successfully created: ${result.name} (ID: ${result.id})`);
      console.log(
        `📊 Created ${result.optionGroups.length} option groups with total ${result.optionGroups.reduce((total, group) => total + group.options.length, 0)} options`
      );
    } catch (error) {
      console.error(`❌ Failed to create ${foodItem.name}:`, error);
    }

    console.log("-".repeat(50));
  }

  console.log("\n🎉 Food data seeding completed!");
  console.log("📈 Summary: Check the logs above for detailed results");
}

export default seedFoodData;
