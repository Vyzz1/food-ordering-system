import { foodService } from "./food.service";

async function seedFoodData() {
  const categories = {
    vietnamese: "4ca58325-e1a0-406c-90f4-a4014b8cdcfe",
    korean: "510b8879-2956-47d1-af7e-af492b8da9a7",
    fastFood: "901234f3-396f-472b-bd50-f3a23866f329",
    argentina: "b0bd2777-c17b-4a2f-a486-7a18dc24c1ae",
  };

  const foodItems = [
    {
      name: "Beef Bourguignon",
      description: "Tender beef stewed in red wine with carrots and onions",
      costPrice: 9.0,
      sellingPrice: 13.5,
      images: [],
      timeEstimate: 30,
      categoryId: "4b039af9-033d-418c-be4e-b2919aa91401",
      optionGroups: [
        {
          name: "Protein Choice",
          required: true,
          multiple: false,
          freeLimit: 0,
          sequence: 1,
          options: [
            { optionName: "Beef", additionalPrice: 0, sequence: 1 },
            { optionName: "Pork", additionalPrice: 0.5, sequence: 2 },
          ],
        },
        {
          name: "Side",
          required: true,
          multiple: false,
          freeLimit: 0,
          sequence: 2,
          options: [
            { optionName: "Mashed Potatoes", additionalPrice: 0, sequence: 1 },
            {
              optionName: "Roasted Vegetables",
              additionalPrice: 0,
              sequence: 2,
            },
          ],
        },
        {
          name: "Garnish",
          required: false,
          multiple: true,
          freeLimit: 1,
          sequence: 3,
          options: [
            { optionName: "Parsley", additionalPrice: 0.3, sequence: 1 },
            { optionName: "Thyme", additionalPrice: 0.3, sequence: 2 },
          ],
        },
      ],
    },
    {
      name: "Ratatouille",
      description:
        "Colorful vegetable stew with zucchini, eggplant, and tomatoes",
      costPrice: 5.0,
      sellingPrice: 8.0,
      images: [],
      timeEstimate: 18,
      categoryId: "4b039af9-033d-418c-be4e-b2919aa91401",
      optionGroups: [
        {
          name: "Serving Style",
          required: true,
          multiple: false,
          freeLimit: 0,
          sequence: 1,
          options: [
            { optionName: "Traditional", additionalPrice: 0, sequence: 1 },
            { optionName: "Deconstructed", additionalPrice: 0.5, sequence: 2 },
          ],
        },
        {
          name: "Extras",
          required: false,
          multiple: true,
          freeLimit: 1,
          sequence: 2,
          options: [
            { optionName: "Feta Cheese", additionalPrice: 0.5, sequence: 1 },
            { optionName: "Fresh Basil", additionalPrice: 0.3, sequence: 2 },
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
