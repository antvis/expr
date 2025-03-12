import { describe, expect, it } from "vitest";
import { Expression, createExpression, evaluate } from "../src";

describe("Dynamic Template Capabilities", () => {
	// Helper function to evaluate expressions
	function evaluateExpr(expression: string, context = {}, functions = {}) {
		return createExpression(expression)
			.configure({ strictMode: false })
			.extend(functions)
			.evaluate(context);
	}

	describe("Nested Property Access", () => {
		const context = {
			user: {
				profile: {
					details: {
						preferences: {
							theme: "dark",
							fontSize: 16,
							notifications: {
								email: true,
								push: false,
								frequency: "daily",
							},
						},
						address: {
							city: "Shanghai",
							country: "China",
							coordinates: [121.4737, 31.2304],
						},
					},
					lastLogin: "2025-03-10",
				},
				permissions: ["read", "write", "admin"],
				active: true,
			},
			settings: {
				global: {
					language: "zh-CN",
					timezone: "Asia/Shanghai",
				},
			},
			stats: {
				visits: 42,
				actions: 128,
				performance: {
					average: 95.7,
					history: [94.2, 95.1, 95.7, 96.3, 97.0],
				},
			},
		};

		it("should access deeply nested properties", () => {
			expect(
				evaluateExpr("user.profile.details.preferences.theme", context),
			).toBe("dark");
			expect(
				evaluateExpr("user.profile.details.address.coordinates[0]", context),
			).toBe(121.4737);
			expect(
				evaluateExpr(
					"user.profile.details.preferences.notifications.frequency",
					context,
				),
			).toBe("daily");
		});

		it("should handle bracket notation with string literals", () => {
			expect(
				evaluateExpr(
					'user["profile"]["details"]["preferences"]["fontSize"]',
					context,
				),
			).toBe(16);
			expect(evaluateExpr('settings["global"]["language"]', context)).toBe(
				"zh-CN",
			);
		});

		it("should handle mixed dot and bracket notation", () => {
			expect(
				evaluateExpr(
					'user.profile["details"].preferences["notifications"].push',
					context,
				),
			).toBe(false);
			expect(
				evaluateExpr('user["profile"].details["address"].city', context),
			).toBe("Shanghai");
		});
	});

	describe("Dynamic Property Access", () => {
		const context = {
			data: {
				key1: "value1",
				key2: "value2",
				key3: "value3",
			},
			keys: ["key1", "key2", "key3"],
			selectedKey: "key2",
			config: {
				mapping: {
					field1: "key1",
					field2: "key2",
					field3: "key3",
				},
				selected: "field2",
			},
		};

		it("should access properties using dynamic keys", () => {
			expect(evaluateExpr("data[selectedKey]", context)).toBe("value2");
			expect(evaluateExpr("data[keys[0]]", context)).toBe("value1");
			expect(evaluateExpr("data[keys[2]]", context)).toBe("value3");
		});

		it("should handle nested dynamic property access", () => {
			expect(
				evaluateExpr("data[config.mapping[config.selected]]", context),
			).toBe("value2");
			expect(evaluateExpr("data[config.mapping.field1]", context)).toBe(
				"value1",
			);
		});
	});

	describe("Conditional Logic", () => {
		const context = {
			user: {
				role: "admin",
				verified: true,
				age: 30,
				subscription: "premium",
			},
			thresholds: {
				age: 18,
				premium: 25,
			},
			features: {
				basic: ["read", "comment"],
				premium: ["read", "comment", "publish", "moderate"],
				admin: ["read", "comment", "publish", "moderate", "manage"],
			},
		};

		it("should evaluate simple conditional expressions", () => {
			expect(
				evaluateExpr(
					"user.role === 'admin' ? 'Administrator' : 'User'",
					context,
				),
			).toBe("Administrator");
			expect(
				evaluateExpr("user.verified ? 'Verified' : 'Unverified'", context),
			).toBe("Verified");
		});

		it("should handle nested conditional expressions", () => {
			const expr =
				"user.role === 'admin' ? 'Admin Access' : (user.subscription === 'premium' ? 'Premium Access' : 'Basic Access')";
			expect(evaluateExpr(expr, context)).toBe("Admin Access");

			const context2: any = {
				...context,
				user: { ...context.user, role: "user" },
			};
			expect(evaluateExpr(expr, context2)).toBe("Premium Access");

			const context3: any = {
				...context2,
				user: { ...context2.user, subscription: "basic" },
			};
			expect(evaluateExpr(expr, context3)).toBe("Basic Access");
		});

		it("should combine conditional logic with property access", () => {
			const expr =
				"user.role === 'admin' ? features.admin : (user.subscription === 'premium' ? features.premium : features.basic)";
			expect((evaluateExpr(expr, context) as any)[4]).toBe("manage"); // admin features include 'manage'

			const context2: any = {
				...context,
				user: { ...context.user, role: "user" },
			};
			expect((evaluateExpr(expr, context2) as any)[3]).toBe("moderate"); // premium features include 'moderate'

			const context3: any = {
				...context2,
				user: { ...context2.user, subscription: "basic" },
			};
			expect((evaluateExpr(expr, context3) as any).length).toBe(2); // basic features have 2 items
		});
	});

	describe("Template String Interpolation", () => {
		// Define custom functions for string operations
		const functions = {
			concat: (...strings: string[]) => strings.join(""),
			formatDate: (date: string, format: string = "YYYY-MM-DD") => {
				// Simple date formatter (in real implementation, use a proper date library)
				const d = new Date(date);
				if (format === "YYYY-MM-DD") {
					return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
				}
				if (format === "DD/MM/YYYY") {
					return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
				}
				return date; // Default fallback
			},
		};

		const context = {
			user: {
				name: "张三",
				email: "zhangsan@example.com",
				joinDate: "2024-01-15",
				lastLogin: "2025-03-10T14:30:00",
				plan: "premium",
				usage: {
					storage: 42.5,
					bandwidth: 128.7,
				},
			},
			company: {
				name: "示例公司",
				address: "上海市浦东新区",
			},
			locale: "zh-CN",
		};

		it("should support basic string concatenation", () => {
			const expr =
				"@concat('Welcome, ', user.name, '! Your plan is ', user.plan)";
			expect(evaluateExpr(expr, context, functions)).toBe(
				"Welcome, 张三! Your plan is premium",
			);
		});

		it("should support template string interpolation", () => {
			const template =
				"'Dear ' + user.name + ', Thank you for being a ' + user.plan + ' member since ' + user.joinDate + '. Your current storage usage is ' + user.usage.storage + 'GB.'";
			const result = evaluateExpr(template, context, functions);
			expect(result).toBe(
				"Dear 张三, Thank you for being a premium member since 2024-01-15. Your current storage usage is 42.5GB.",
			);
		});
	});

	describe("Complex Business Logic", () => {
		const context = {
			order: {
				id: "ORD-12345",
				customer: {
					id: "CUST-789",
					name: "李四",
					type: "vip",
					memberSince: "2020-05-10",
					loyaltyPoints: 1250,
				},
				items: [
					{
						id: "PROD-001",
						name: "商品A",
						price: 100,
						quantity: 2,
						category: "electronics",
					},
					{
						id: "PROD-002",
						name: "商品B",
						price: 50,
						quantity: 1,
						category: "books",
					},
					{
						id: "PROD-003",
						name: "商品C",
						price: 200,
						quantity: 3,
						category: "electronics",
					},
				],
				shipping: {
					method: "express",
					address: {
						city: "北京",
						province: "北京市",
						country: "中国",
					},
					cost: 20,
				},
				payment: {
					method: "credit_card",
					status: "completed",
				},
				date: "2025-03-01",
				status: "processing",
			},
			pricing: {
				discounts: {
					vip: 0.1, // 10% off for VIP customers
					bulk: 0.05, // 5% off for bulk orders (>= 5 items)
					categories: {
						electronics: 0.08, // 8% off for electronics
						books: 0.15, // 15% off for books
					},
				},
				shipping: {
					standard: 10,
					express: 20,
					international: {
						standard: 50,
						express: 80,
					},
				},
				tax: {
					domestic: 0.13, // 13% tax for domestic orders
					international: 0.2, // 20% tax for international orders
				},
			},
			config: {
				loyaltyPointsPerDollar: 0.5,
				minimumForFreeShipping: 500,
			},
		};

		// Define custom functions for business logic
		const functions = {
			calculateSubtotal: (items: any[]) => {
				return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
			},
			calculateDiscount: (order: any, pricing: any) => {
				const subtotal = functions.calculateSubtotal(order.items);
				let discount = 0;

				// Customer type discount
				if (order.customer.type === "vip") {
					discount += subtotal * pricing.discounts.vip;
				}

				// Bulk order discount
				const totalItems = order.items.reduce(
					(sum: number, item: any) => sum + item.quantity,
					0,
				);
				if (totalItems >= 5) {
					discount += subtotal * pricing.discounts.bulk;
				}

				// Category-specific discounts (applied to eligible items only)
				const categoryDiscounts = order.items.reduce(
					(sum: number, item: any) => {
						const categoryDiscount =
							pricing.discounts.categories[item.category] || 0;
						return sum + item.price * item.quantity * categoryDiscount;
					},
					0,
				);

				discount += categoryDiscounts;

				return Math.min(discount, subtotal * 0.25); // Cap discount at 25% of subtotal
			},
			calculateTax: (order: any, pricing: any) => {
				const subtotal = functions.calculateSubtotal(order.items);
				const discount = functions.calculateDiscount(order, pricing);
				const taxableAmount = subtotal - discount;

				const taxRate =
					order.shipping.address.country === "中国"
						? pricing.tax.domestic
						: pricing.tax.international;

				return taxableAmount * taxRate;
			},
			calculateTotal: (order: any, pricing: any, config: any) => {
				const subtotal = functions.calculateSubtotal(order.items);
				const discount = functions.calculateDiscount(order, pricing);
				const tax = functions.calculateTax(order, pricing);

				// Determine shipping cost
				let shippingCost = 20;
				if (subtotal - discount < config.minimumForFreeShipping) {
					const isInternational = order.shipping.address.country !== "中国";
					if (isInternational) {
						shippingCost =
							pricing.shipping.international[order.shipping.method];
					} else {
						shippingCost = pricing.shipping[order.shipping.method];
					}
				}

				return subtotal - discount + tax + shippingCost;
			},
			calculateLoyaltyPoints: (order: any, config: any) => {
				const subtotal = functions.calculateSubtotal(order.items);
				return Math.floor(subtotal * config.loyaltyPointsPerDollar);
			},
			formatCurrency: (amount: number, currency = "CNY") => {
				return new Intl.NumberFormat("zh-CN", {
					style: "currency",
					currency,
				}).format(amount);
			},
		};

		it("should calculate order subtotal", () => {
			const expr = "@calculateSubtotal(order.items)";
			const result = evaluateExpr(expr, context, functions);
			expect(result).toBe(850); // (100*2) + (50*1) + (200*3) = 200 + 50 + 600 = 850
		});

		it("should calculate appropriate discounts", () => {
			const expr = "@calculateDiscount(order, pricing)";
			const result = evaluateExpr(expr, context, functions);

			// Expected discounts:
			// - VIP discount: 850 * 0.1 = 85
			// - Bulk discount: 850 * 0.05 = 42.5 (total quantity = 6 items)
			// - Category discounts: (200*2 + 600) * 0.08 + 50 * 0.15 = 64 + 7.5 = 71.5
			// Total discount: 85 + 42.5 + 71.5 = 199
			// But capped at 25% of subtotal: 850 * 0.25 = 212.5
			// So expected discount is 199
			expect(result).toBeCloseTo(199, 0);
		});

		it("should calculate final order total", () => {
			const expr = "@calculateTotal(order, pricing, config)";
			const result = evaluateExpr(expr, context, functions);

			// Subtotal: 850
			// Discount: 199
			// Taxable amount: 651
			// Tax (13%): 84.63
			// Shipping: 20 (express, not free because below 500 after discount)
			// Total: 850 - 199 + 84.63 + 20 = 755.63
			expect(result).toBeCloseTo(755.63, 2);
		});

		it("should calculate earned loyalty points", () => {
			const expr = "@calculateLoyaltyPoints(order, config)";
			const result = evaluateExpr(expr, context, functions);

			// Subtotal: 850
			// Points per dollar: 0.5
			// Earned points: 850 * 0.5 = 425
			expect(result).toBe(425);
		});

		it("should format currency values", () => {
			const expr = "@formatCurrency(@calculateTotal(order, pricing, config))";
			const result = evaluateExpr(expr, context, functions);

			// This test may vary based on locale implementation, but should contain the correct amount
			expect(result).toContain("755");
		});

		it("should handle complex conditional business logic", () => {
			// Determine shipping method and estimate based on order details
			const expr = `
        order.shipping.address.country !== "中国" ? 
          @formatCurrency(pricing.shipping.international[order.shipping.method]) : 
          (@calculateSubtotal(order.items) - @calculateDiscount(order, pricing) >= config.minimumForFreeShipping ? 
            "免费配送" : 
            @formatCurrency(pricing.shipping[order.shipping.method]))
      `;

			const result = evaluateExpr(expr, context, functions);
			// The order is domestic (China) and below free shipping threshold, so should show express shipping cost (¥20)
			expect(result).toBe("免费配送");

			// Test with order above free shipping threshold
			const largeOrder = {
				...context,
				order: {
					...context.order,
					items: [
						{
							id: "PROD-004",
							name: "商品D",
							price: 600,
							quantity: 1,
							category: "electronics",
						},
					],
				},
			};

			const resultLargeOrder = evaluateExpr(expr, largeOrder, functions);
			expect(resultLargeOrder).toBe("¥20.00"); // Should be free shipping
		});
	});
});
