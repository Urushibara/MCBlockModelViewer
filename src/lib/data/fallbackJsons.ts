//fallbackJsons.ts

// for testing
export const mock_datas = {
	"assets/minecraft/models/block/iron_bars_post_be.json": {
		"ambientocclusion": false,
		"textures": {
			"particle": "block/iron_bars",
			"bars": "block/iron_bars"
		},
		"elements": [
			{
				"from": [7, 0, 7],
				"to": [9, 16, 9],
				"faces": {
					"east": { "uv": [7, 0, 9, 16], "texture": "#bars" },
					"west": { "uv": [7, 0, 9, 16], "texture": "#bars" }
				}
			},
			{
				"from": [7, 0, 7],
				"to": [9, 16, 9],
				"faces": {
					"north": { "uv": [7, 0, 9, 16], "texture": "#bars" },
					"south": { "uv": [7, 0, 9, 16], "texture": "#bars" }
				}
			}
		]
	}
};

// complement blocks
export const complement_blocks = {
	"assets/minecraft/models/block/lava.json": {
		"parent": "block/liquid",
		"textures": {
			"still": "block/lava_still",
			"flow": "block/lava_flow"
		}
	},
	"assets/minecraft/models/block/water.json": {
		"parent": "block/liquid",
		"textures": {
			"still": "block/water_still",
			"flow": "block/water_flow"
		}
	},
	"assets/minecraft/models/block/liquid.json": {
		"elements": [
			{
				"from": [0, 0, 0],
				"to": [16, 13, 16],
				"faces": {
					"north": { "uv": [8, 9.5, 0, 16], "texture": "#flow", "cullface": "north", "tintindex": 0 },
					"east": { "uv": [8, 9.5, 0, 16], "texture": "#flow", "cullface": "east", "tintindex": 0 },
					"south": { "uv": [8, 9.5, 0, 16], "texture": "#flow", "cullface": "south", "tintindex": 0 },
					"west": { "uv": [8, 9.5, 0, 16], "texture": "#flow", "cullface": "west", "tintindex": 0 },
					"up": { "uv": [0, 0, 16, 16], "texture": "#still", "tintindex": 0 },
					"down": { "uv": [0, 0, 16, 16], "texture": "#still", "cullface": "down", "tintindex": 0 }
				}
			},
			{
				"from": [15.998, 0.002, 0.002],
				"to": [0.002, 12.998, 15.998],
				"faces": {
					"north": { "uv": [7.996, 9.5, 0, 15.996], "texture": "#flow", "cullface": "south", "tintindex": 0 },
					"east": { "uv": [7.996, 9.5, 0, 15.996], "texture": "#flow", "cullface": "west", "tintindex": 0 },
					"south": { "uv": [7.996, 9.5, 0, 15.996], "texture": "#flow", "cullface": "north", "tintindex": 0 },
					"west": { "uv": [7.996, 9.5, 0, 15.996], "texture": "#flow", "cullface": "east", "tintindex": 0 },
					"up": { "uv": [16, 0, 0, 16], "texture": "#still", "tintindex": 0 }
				}
			}
		]
	},
	// signs block models
	"assets/minecraft/blockstates/oak_sign.json": {
		"variants": {
			"facing=north": { "model": "block/oak_sign" },
			"facing=east": { "model": "block/oak_sign", "y": 90 },
			"facing=south": { "model": "block/oak_sign", "y": 180 },
			"facing=west": { "model": "block/oak_sign", "y": 270 }
		}
	},
	"assets/minecraft/blockstates/spruce_sign.json": {
		"variants": {
			"facing=north": { "model": "block/spruce_sign" },
			"facing=east": { "model": "block/spruce_sign", "y": 90 },
			"facing=south": { "model": "block/spruce_sign", "y": 180 },
			"facing=west": { "model": "block/spruce_sign", "y": 270 }
		}
	},
	"assets/minecraft/blockstates/birch_sign.json": {
		"variants": {
			"facing=north": { "model": "block/birch_sign" },
			"facing=east": { "model": "block/birch_sign", "y": 90 },
			"facing=south": { "model": "block/birch_sign", "y": 180 },
			"facing=west": { "model": "block/birch_sign", "y": 270 }
		}
	},
	"assets/minecraft/blockstates/jungle_sign.json": {
		"variants": {
			"facing=north": { "model": "block/jungle_sign" },
			"facing=east": { "model": "block/jungle_sign", "y": 90 },
			"facing=south": { "model": "block/jungle_sign", "y": 180 },
			"facing=west": { "model": "block/jungle_sign", "y": 270 }
		}
	},
	"assets/minecraft/blockstates/acacia_sign.json": {
		"variants": {
			"facing=north": { "model": "block/acacia_sign" },
			"facing=east": { "model": "block/acacia_sign", "y": 90 },
			"facing=south": { "model": "block/acacia_sign", "y": 180 },
			"facing=west": { "model": "block/acacia_sign", "y": 270 }
		}
	},
	"assets/minecraft/blockstates/dark_oak_sign.json": {
		"variants": {
			"facing=north": { "model": "block/dark_oak_sign" },
			"facing=east": { "model": "block/dark_oak_sign", "y": 90 },
			"facing=south": { "model": "block/dark_oak_sign", "y": 180 },
			"facing=west": { "model": "block/dark_oak_sign", "y": 270 }
		}
	},
	"assets/minecraft/blockstates/mangrove_sign.json": {
		"variants": {
			"facing=north": { "model": "block/mangrove_sign" },
			"facing=east": { "model": "block/mangrove_sign", "y": 90 },
			"facing=south": { "model": "block/mangrove_sign", "y": 180 },
			"facing=west": { "model": "block/mangrove_sign", "y": 270 }
		}
	},
	"assets/minecraft/blockstates/cherry_sign.json": {
		"variants": {
			"facing=north": { "model": "block/cherry_sign" },
			"facing=east": { "model": "block/cherry_sign", "y": 90 },
			"facing=south": { "model": "block/cherry_sign", "y": 180 },
			"facing=west": { "model": "block/cherry_sign", "y": 270 }
		}
	},
	"assets/minecraft/blockstates/pale_oak_sign.json": {
		"variants": {
			"facing=north": { "model": "block/pale_oak_sign" },
			"facing=east": { "model": "block/pale_oak_sign", "y": 90 },
			"facing=south": { "model": "block/pale_oak_sign", "y": 180 },
			"facing=west": { "model": "block/pale_oak_sign", "y": 270 }
		}
	},
	"assets/minecraft/blockstates/bamboo_sign.json": {
		"variants": {
			"facing=north": { "model": "block/bamboo_sign" },
			"facing=east": { "model": "block/bamboo_sign", "y": 90 },
			"facing=south": { "model": "block/bamboo_sign", "y": 180 },
			"facing=west": { "model": "block/bamboo_sign", "y": 270 }
		}
	},
	"assets/minecraft/blockstates/crimson_sign.json": {
		"variants": {
			"facing=north": { "model": "block/crimson_sign" },
			"facing=east": { "model": "block/crimson_sign", "y": 90 },
			"facing=south": { "model": "block/crimson_sign", "y": 180 },
			"facing=west": { "model": "block/crimson_sign", "y": 270 }
		}
	},
	"assets/minecraft/blockstates/warped_sign.json": {
		"variants": {
			"facing=north": { "model": "block/warped_sign" },
			"facing=east": { "model": "block/warped_sign", "y": 90 },
			"facing=south": { "model": "block/warped_sign", "y": 180 },
			"facing=west": { "model": "block/warped_sign", "y": 270 }
		}
	},
	"assets/minecraft/models/block/oak_sign.json": { "parent": "block/sign", "textures": { "sign": "entity/signs/oak" } },
	"assets/minecraft/models/block/spruce_sign.json": { "parent": "block/sign", "textures": { "sign": "entity/signs/spruce" } },
	"assets/minecraft/models/block/birch_sign.json": { "parent": "block/sign", "textures": { "sign": "entity/signs/birch" } },
	"assets/minecraft/models/block/jungle_sign.json": { "parent": "block/sign", "textures": { "sign": "entity/signs/jungle" } },
	"assets/minecraft/models/block/acacia_sign.json": { "parent": "block/sign", "textures": { "sign": "entity/signs/acacia" } },
	"assets/minecraft/models/block/dark_oak_sign.json": { "parent": "block/sign", "textures": { "sign": "entity/signs/dark_oak" } },
	"assets/minecraft/models/block/mangrove_sign.json": { "parent": "block/sign", "textures": { "sign": "entity/signs/mangrove" } },
	"assets/minecraft/models/block/cherry_sign.json": { "parent": "block/sign", "textures": { "sign": "entity/signs/cherry" } },
	"assets/minecraft/models/block/pale_oak_sign.json": { "parent": "block/sign", "textures": { "sign": "entity/signs/pale_oak" } },
	"assets/minecraft/models/block/bamboo_sign.json": { "parent": "block/sign", "textures": { "sign": "entity/signs/bamboo" } },
	"assets/minecraft/models/block/crimson_sign.json": { "parent": "block/sign", "textures": { "sign": "entity/signs/crimson" } },
	"assets/minecraft/models/block/warped_sign.json": { "parent": "block/sign", "textures": { "sign": "entity/signs/warped" } },
	"assets/minecraft/models/block/sign.json": {
		"elements": [
			{
				"from": [7.36, 0, 7.36],
				"to": [8.69333, 9.33333, 8.69333],
				"faces": {
					"north": { "uv": [0.5, 8, 1, 15], "texture": "#sign" },
					"east": { "uv": [0, 8, 0.5, 15], "texture": "#sign" },
					"south": { "uv": [1.5, 8, 2, 15], "texture": "#sign" },
					"west": { "uv": [1, 8, 1.5, 15], "texture": "#sign" },
					"up": { "uv": [0.5, 7, 1, 8], "rotation": 180, "texture": "#sign" },
					"down": { "uv": [1.5, 7, 1, 8], "texture": "#sign" }
				}
			},
			{
				"from": [0, 9.33, 7.36],
				"to": [16, 17.33, 8.69333],
				"faces": {
					"north": { "uv": [0.5, 1, 6.5, 7], "texture": "#sign" },
					"east": { "uv": [0, 1, 0.5, 7], "texture": "#sign" },
					"south": { "uv": [7, 1, 13, 7], "texture": "#sign" },
					"west": { "uv": [6.5, 1, 7, 7], "texture": "#sign" },
					"up": { "uv": [0.5, 0, 6.5, 1], "rotation": 180, "texture": "#sign" },
					"down": { "uv": [12.5, 0, 6.5, 1], "texture": "#sign" }
				}
			}
		]
	},
	// wall signs blockstate
	"assets/minecraft/blockstates/oak_wall_sign.json": {
		"variants": {
			"facing=north": { "model": "block/oak_wall_sign", "y": 180 },
			"facing=south": { "model": "block/oak_wall_sign" },
			"facing=west": { "model": "block/oak_wall_sign", "y": 90 },
			"facing=east": { "model": "block/oak_wall_sign", "y": 270 }
		}
	},
	"assets/minecraft/blockstates/spruce_wall_sign.json": {
		"variants": {
			"facing=north": { "model": "block/spruce_wall_sign", "y": 180 },
			"facing=south": { "model": "block/spruce_wall_sign" },
			"facing=west": { "model": "block/spruce_wall_sign", "y": 90 },
			"facing=east": { "model": "block/spruce_wall_sign", "y": 270 }
		}
	},
	"assets/minecraft/blockstates/birch_wall_sign.json": {
		"variants": {
			"facing=north": { "model": "block/birch_wall_sign", "y": 180 },
			"facing=south": { "model": "block/birch_wall_sign" },
			"facing=west": { "model": "block/birch_wall_sign", "y": 90 },
			"facing=east": { "model": "block/birch_wall_sign", "y": 270 }
		}
	},
	"assets/minecraft/blockstates/jungle_wall_sign.json": {
		"variants": {
			"facing=north": { "model": "block/jungle_wall_sign", "y": 180 },
			"facing=south": { "model": "block/jungle_wall_sign" },
			"facing=west": { "model": "block/jungle_wall_sign", "y": 90 },
			"facing=east": { "model": "block/jungle_wall_sign", "y": 270 }
		}
	},
	"assets/minecraft/blockstates/acacia_wall_sign.json": {
		"variants": {
			"facing=north": { "model": "block/acacia_wall_sign", "y": 180 },
			"facing=south": { "model": "block/acacia_wall_sign" },
			"facing=west": { "model": "block/acacia_wall_sign", "y": 90 },
			"facing=east": { "model": "block/acacia_wall_sign", "y": 270 }
		}
	},
	"assets/minecraft/blockstates/dark_oak_wall_sign.json": {
		"variants": {
			"facing=north": { "model": "block/dark_oak_wall_sign", "y": 180 },
			"facing=south": { "model": "block/dark_oak_wall_sign" },
			"facing=west": { "model": "block/dark_oak_wall_sign", "y": 90 },
			"facing=east": { "model": "block/dark_oak_wall_sign", "y": 270 }
		}
	},
	"assets/minecraft/blockstates/mangrove_wall_sign.json": {
		"variants": {
			"facing=north": { "model": "block/mangrove_wall_sign", "y": 180 },
			"facing=south": { "model": "block/mangrove_wall_sign" },
			"facing=west": { "model": "block/mangrove_wall_sign", "y": 90 },
			"facing=east": { "model": "block/mangrove_wall_sign", "y": 270 }
		}
	},
	"assets/minecraft/blockstates/cherry_wall_sign.json": {
		"variants": {
			"facing=north": { "model": "block/cherry_wall_sign", "y": 180 },
			"facing=south": { "model": "block/cherry_wall_sign" },
			"facing=west": { "model": "block/cherry_wall_sign", "y": 90 },
			"facing=east": { "model": "block/cherry_wall_sign", "y": 270 }
		}
	},
	"assets/minecraft/blockstates/pale_oak_wall_sign.json": {
		"variants": {
			"facing=north": { "model": "block/pale_oak_wall_sign", "y": 180 },
			"facing=south": { "model": "block/pale_oak_wall_sign" },
			"facing=west": { "model": "block/pale_oak_wall_sign", "y": 90 },
			"facing=east": { "model": "block/pale_oak_wall_sign", "y": 270 }
		}
	},
	"assets/minecraft/blockstates/bamboo_wall_sign.json": {
		"variants": {
			"facing=north": { "model": "block/bamboo_wall_sign", "y": 180 },
			"facing=south": { "model": "block/bamboo_wall_sign" },
			"facing=west": { "model": "block/bamboo_wall_sign", "y": 90 },
			"facing=east": { "model": "block/bamboo_wall_sign", "y": 270 }
		}
	},
	"assets/minecraft/blockstates/crimson_wall_sign.json": {
		"variants": {
			"facing=north": { "model": "block/crimson_wall_sign", "y": 180 },
			"facing=south": { "model": "block/crimson_wall_sign" },
			"facing=west": { "model": "block/crimson_wall_sign", "y": 90 },
			"facing=east": { "model": "block/crimson_wall_sign", "y": 270 }
		}
	},
	"assets/minecraft/blockstates/warped_wall_sign.json": {
		"variants": {
			"facing=north": { "model": "block/warped_wall_sign", "y": 180 },
			"facing=south": { "model": "block/warped_wall_sign" },
			"facing=west": { "model": "block/warped_wall_sign", "y": 90 },
			"facing=east": { "model": "block/warped_wall_sign", "y": 270 }
		}
	},
	// wall signs block models
	"assets/minecraft/models/block/oak_wall_sign.json": { "parent": "block/wall_sign", "textures": { "sign": "entity/signs/oak" } },
	"assets/minecraft/models/block/spruce_wall_sign.json": { "parent": "block/wall_sign", "textures": { "sign": "entity/signs/spruce" } },
	"assets/minecraft/models/block/birch_wall_sign.json": { "parent": "block/wall_sign", "textures": { "sign": "entity/signs/birch" } },
	"assets/minecraft/models/block/jungle_wall_sign.json": { "parent": "block/wall_sign", "textures": { "sign": "entity/signs/jungle" } },
	"assets/minecraft/models/block/acacia_wall_sign.json": { "parent": "block/wall_sign", "textures": { "sign": "entity/signs/acacia" } },
	"assets/minecraft/models/block/dark_oak_wall_sign.json": { "parent": "block/wall_sign", "textures": { "sign": "entity/signs/dark_oak" } },
	"assets/minecraft/models/block/mangrove_wall_sign.json": { "parent": "block/wall_sign", "textures": { "sign": "entity/signs/mangrove" } },
	"assets/minecraft/models/block/cherry_wall_sign.json": { "parent": "block/wall_sign", "textures": { "sign": "entity/signs/cherry" } },
	"assets/minecraft/models/block/pale_oak_wall_sign.json": { "parent": "block/wall_sign", "textures": { "sign": "entity/signs/pale_oak" } },
	"assets/minecraft/models/block/bamboo_wall_sign.json": { "parent": "block/wall_sign", "textures": { "sign": "entity/signs/bamboo" } },
	"assets/minecraft/models/block/crimson_wall_sign.json": { "parent": "block/wall_sign", "textures": { "sign": "entity/signs/crimson" } },
	"assets/minecraft/models/block/warped_wall_sign.json": { "parent": "block/wall_sign", "textures": { "sign": "entity/signs/warped" } },
	"assets/minecraft/models/block/wall_sign.json": {
		"elements": [
			{
				"from": [0, 2, 14],
				"to": [16, 10, 15.33333],
				"faces": {
					"north": { "uv": [0.5, 1, 6.5, 7], "texture": "#sign" },
					"east": { "uv": [0, 1, 0.5, 7], "texture": "#sign" },
					"south": { "uv": [7, 1, 13, 7], "texture": "#sign" },
					"west": { "uv": [6.5, 1, 7, 7], "texture": "#sign" },
					"up": { "uv": [6.5, 1, 0.5, 0], "texture": "#sign" },
					"down": { "uv": [12.5, 0, 6.5, 1], "texture": "#sign" }
				}
			}
		]
	},
	// hunging signs
	"assets/minecraft/models/block/oak_hanging_sign.json": { "parent": "block/hanging_sign", "textures": { "sign": "entity/signs/hanging/oak" } },
	"assets/minecraft/models/block/spruce_hanging_sign.json": { "parent": "block/hanging_sign", "textures": { "sign": "entity/signs/hanging/spruce" } },
	"assets/minecraft/models/block/birch_hanging_sign.json": { "parent": "block/hanging_sign", "textures": { "sign": "entity/signs/hanging/birch" } },
	"assets/minecraft/models/block/jungle_hanging_sign.json": { "parent": "block/hanging_sign", "textures": { "sign": "entity/signs/hanging/jungle" } },
	"assets/minecraft/models/block/acacia_hanging_sign.json": { "parent": "block/hanging_sign", "textures": { "sign": "entity/signs/hanging/acacia" } },
	"assets/minecraft/models/block/dark_oak_hanging_sign.json": { "parent": "block/hanging_sign", "textures": { "sign": "entity/signs/hanging/dark_oak" } },
	"assets/minecraft/models/block/mangrove_hanging_sign.json": { "parent": "block/hanging_sign", "textures": { "sign": "entity/signs/hanging/mangrove" } },
	"assets/minecraft/models/block/cherry_hanging_sign.json": { "parent": "block/hanging_sign", "textures": { "sign": "entity/signs/hanging/cherry" } },
	"assets/minecraft/models/block/pale_oak_hanging_sign.json": { "parent": "block/hanging_sign", "textures": { "sign": "entity/signs/hanging/pale_oak" } },
	"assets/minecraft/models/block/bamboo_hanging_sign.json": { "parent": "block/hanging_sign", "textures": { "sign": "entity/signs/hanging/bamboo" } },
	"assets/minecraft/models/block/crimson_hanging_sign.json": { "parent": "block/hanging_sign", "textures": { "sign": "entity/signs/hanging/crimson" } },
	"assets/minecraft/models/block/warped_hanging_sign.json": { "parent": "block/hanging_sign", "textures": { "sign": "entity/signs/hanging/warped" } },
	"assets/minecraft/models/block/hanging_sign.json": {
		"elements": [
			{
				"from": [1, 0, 7],
				"to": [15, 10, 9],
				"faces": {
					"north": { "uv": [0.5, 7, 4, 12], "texture": "#sign" },
					"east": { "uv": [0, 7, 0.5, 12], "texture": "#sign" },
					"south": { "uv": [4.5, 7, 8, 12], "texture": "#sign" },
					"west": { "uv": [4, 7, 4.5, 12], "texture": "#sign" },
					"up": { "uv": [4, 7, 0.5, 6], "texture": "#sign" },
					"down": { "uv": [7.5, 6, 4, 7], "texture": "#sign" }
				}
			},
			{
				"from": [1.5, 10, 8],
				"to": [4.5, 16, 8],
				"rotation": { "angle": 45, "axis": "y", "origin": [3, 13, 8] },
				"faces": {
					"north": { "uv": [0, 3, 0.75, 6], "texture": "#sign" },
					"south": { "uv": [0, 3, 0.75, 6], "texture": "#sign" }
				}
			},
			{
				"from": [1.5, 10, 8],
				"to": [4.5, 16, 8],
				"rotation": { "angle": -45, "axis": "y", "origin": [3, 13, 8] },
				"faces": {
					"north": { "uv": [1.5, 3, 2.25, 6], "texture": "#sign" },
					"south": { "uv": [1.5, 3, 2.25, 6], "texture": "#sign" }
				}
			},
			{
				"from": [11.5, 10, 8],
				"to": [14.5, 16, 8],
				"rotation": { "angle": 45, "axis": "y", "origin": [13, 13, 8] },
				"faces": {
					"north": { "uv": [0, 3, 0.75, 6], "texture": "#sign" },
					"south": { "uv": [0, 3, 0.75, 6], "texture": "#sign" }
				}
			},
			{
				"from": [11.5, 10, 8],
				"to": [14.5, 16, 8],
				"rotation": { "angle": -45, "axis": "y", "origin": [13, 13, 8] },
				"faces": {
					"north": { "uv": [1.5, 3, 2.25, 6], "texture": "#sign" },
					"south": { "uv": [1.5, 3, 2.25, 6], "texture": "#sign" }
				}
			}
		]
	},
	// wall hanging signs blockstate
	"assets/minecraft/blockstates/oak_wall_hanging_sign.json": { "variants": { "": { "model": "block/oak_wall_hanging_sign" } } },
	"assets/minecraft/blockstates/spruce_wall_hanging_sign.json": { "variants": { "": { "model": "block/spruce_wall_hanging_sign" } } },
	"assets/minecraft/blockstates/birch_wall_hanging_sign.json": { "variants": { "": { "model": "block/birch_wall_hanging_sign" } } },
	"assets/minecraft/blockstates/jungle_wall_hanging_sign.json": { "variants": { "": { "model": "block/jungle_wall_hanging_sign" } } },
	"assets/minecraft/blockstates/acacia_wall_hanging_sign.json": { "variants": { "": { "model": "block/acacia_wall_hanging_sign" } } },
	"assets/minecraft/blockstates/dark_oak_wall_hanging_sign.json": { "variants": { "": { "model": "block/dark_oak_wall_hanging_sign" } } },
	"assets/minecraft/blockstates/mangrove_wall_hanging_sign.json": { "variants": { "": { "model": "block/mangrove_wall_hanging_sign" } } },
	"assets/minecraft/blockstates/cherry_wall_hanging_sign.json": { "variants": { "": { "model": "block/cherry_wall_hanging_sign" } } },
	"assets/minecraft/blockstates/pale_oak_wall_hanging_sign.json": { "variants": { "": { "model": "block/pale_oak_wall_hanging_sign" } } },
	"assets/minecraft/blockstates/bamboo_wall_hanging_sign.json": { "variants": { "": { "model": "block/bamboo_wall_hanging_sign" } } },
	"assets/minecraft/blockstates/crimson_wall_hanging_sign.json": { "variants": { "": { "model": "block/crimson_wall_hanging_sign" } } },
	"assets/minecraft/blockstates/warped_wall_hanging_sign.json": { "variants": { "": { "model": "block/warped_wall_hanging_sign" } } },
	"assets/minecraft/models/block/oak_wall_hanging_sign.json": { "parent": "block/wall_hanging_sign", "textures": { "sign": "entity/signs/hanging/oak" } },
	"assets/minecraft/models/block/spruce_wall_hanging_sign.json": { "parent": "block/wall_hanging_sign", "textures": { "sign": "entity/signs/hanging/spruce" } },
	"assets/minecraft/models/block/birch_wall_hanging_sign.json": { "parent": "block/wall_hanging_sign", "textures": { "sign": "entity/signs/hanging/birch" } },
	"assets/minecraft/models/block/jungle_wall_hanging_sign.json": { "parent": "block/wall_hanging_sign", "textures": { "sign": "entity/signs/hanging/jungle" } },
	"assets/minecraft/models/block/acacia_wall_hanging_sign.json": { "parent": "block/wall_hanging_sign", "textures": { "sign": "entity/signs/hanging/acacia" } },
	"assets/minecraft/models/block/dark_oak_wall_hanging_sign.json": { "parent": "block/wall_hanging_sign", "textures": { "sign": "entity/signs/hanging/dark_oak" } },
	"assets/minecraft/models/block/mangrove_wall_hanging_sign.json": { "parent": "block/wall_hanging_sign", "textures": { "sign": "entity/signs/hanging/mangrove" } },
	"assets/minecraft/models/block/cherry_wall_hanging_sign.json": { "parent": "block/wall_hanging_sign", "textures": { "sign": "entity/signs/hanging/cherry" } },
	"assets/minecraft/models/block/pale_oak_wall_hanging_sign.json": { "parent": "block/wall_hanging_sign", "textures": { "sign": "entity/signs/hanging/pale_oak" } },
	"assets/minecraft/models/block/bamboo_wall_hanging_sign.json": { "parent": "block/wall_hanging_sign", "textures": { "sign": "entity/signs/hanging/bamboo" } },
	"assets/minecraft/models/block/crimson_wall_hanging_sign.json": { "parent": "block/wall_hanging_sign", "textures": { "sign": "entity/signs/hanging/crimson" } },
	"assets/minecraft/models/block/warped_wall_hanging_sign.json": { "parent": "block/wall_hanging_sign", "textures": { "sign": "entity/signs/hanging/warped" } },
	"assets/minecraft/models/block/wall_hanging_sign.json": {
		"elements": [
			{
				"from": [11.5, 10, 8],
				"to": [14.5, 16, 8],
				"rotation": { "angle": -45, "axis": "y", "origin": [13, 13, 8] },
				"faces": {
					"north": { "uv": [1.5, 3, 2.25, 6], "texture": "#sign" },
					"south": { "uv": [1.5, 3, 2.25, 6], "texture": "#sign" }
				}
			},
			{
				"from": [11.5, 10, 8],
				"to": [14.5, 16, 8],
				"rotation": { "angle": 45, "axis": "y", "origin": [13, 13, 8] },
				"faces": {
					"north": { "uv": [0, 3, 0.75, 6], "texture": "#sign" },
					"south": { "uv": [0, 3, 0.75, 6], "texture": "#sign" }
				}
			},
			{
				"from": [1.5, 10, 8],
				"to": [4.5, 16, 8],
				"rotation": { "angle": -45, "axis": "y", "origin": [3, 13, 8] },
				"faces": {
					"north": { "uv": [1.5, 3, 2.25, 6], "texture": "#sign" },
					"south": { "uv": [1.5, 3, 2.25, 6], "texture": "#sign" }
				}
			},
			{
				"from": [1.5, 10, 8],
				"to": [4.5, 16, 8],
				"rotation": { "angle": 45, "axis": "y", "origin": [3, 13, 8] },
				"faces": {
					"north": { "uv": [0, 3, 0.75, 6], "texture": "#sign" },
					"south": { "uv": [0, 3, 0.75, 6], "texture": "#sign" }
				}
			},
			{
				"from": [1, 0, 7],
				"to": [15, 10, 9],
				"faces": {
					"north": { "uv": [0.5, 7, 4, 12], "texture": "#sign" },
					"east": { "uv": [0, 7, 0.5, 12], "texture": "#sign" },
					"south": { "uv": [4.5, 7, 8, 12], "texture": "#sign" },
					"west": { "uv": [4, 7, 4.5, 12], "texture": "#sign" },
					"up": { "uv": [4, 7, 0.5, 6], "texture": "#sign" },
					"down": { "uv": [7.5, 6, 4, 7], "texture": "#sign" }
				}
			},
			{
				"from": [0, 14, 6],
				"to": [16, 16, 10],
				"faces": {
					"north": { "uv": [1, 2, 5, 3], "texture": "#sign" },
					"east": { "uv": [0, 2, 1, 3], "texture": "#sign" },
					"south": { "uv": [6, 2, 10, 3], "texture": "#sign" },
					"west": { "uv": [5, 2, 6, 3], "texture": "#sign" },
					"up": { "uv": [5, 2, 1, 0], "texture": "#sign" },
					"down": { "uv": [9, 0, 5, 2], "texture": "#sign" }
				}
			}
		]
	},
	// bell
	"assets/minecraft/blockstates/bell.json": {
		"multipart": [
			{ "apply": { "model": "block/bell" }, "when": { "attachment": "ceiling|double_wall|single_wall|floor", "facing": "north|east|west|south" } },
			{ "apply": { "model": "block/bell_ceiling", "y": 90 }, "when": { "attachment": "ceiling", "facing": "east" } },
			{ "apply": { "model": "block/bell_ceiling" }, "when": { "attachment": "ceiling", "facing": "north" } },
			{ "apply": { "model": "block/bell_ceiling", "y": 180 }, "when": { "attachment": "ceiling", "facing": "south" } },
			{ "apply": { "model": "block/bell_ceiling", "y": 270 }, "when": { "attachment": "ceiling", "facing": "west" } },
			{ "apply": { "model": "block/bell_between_walls" }, "when": { "attachment": "double_wall", "facing": "east" } },
			{ "apply": { "model": "block/bell_between_walls", "y": 270 }, "when": { "attachment": "double_wall", "facing": "north" } },
			{ "apply": { "model": "block/bell_between_walls", "y": 90 }, "when": { "attachment": "double_wall", "facing": "south" } },
			{ "apply": { "model": "block/bell_between_walls", "y": 180 }, "when": { "attachment": "double_wall", "facing": "west" } },
			{ "apply": { "model": "block/bell_floor", "y": 90 }, "when": { "attachment": "floor", "facing": "east" } },
			{ "apply": { "model": "block/bell_floor" }, "when": { "attachment": "floor", "facing": "north" } },
			{ "apply": { "model": "block/bell_floor", "y": 180 }, "when": { "attachment": "floor", "facing": "south" } },
			{ "apply": { "model": "block/bell_floor", "y": 270 }, "when": { "attachment": "floor", "facing": "west" } },
			{ "apply": { "model": "block/bell_wall" }, "when": { "attachment": "single_wall", "facing": "east" } },
			{ "apply": { "model": "block/bell_wall", "y": 270 }, "when": { "attachment": "single_wall", "facing": "north" } },
			{ "apply": { "model": "block/bell_wall", "y": 90 }, "when": { "attachment": "single_wall", "facing": "south" } },
			{ "apply": { "model": "block/bell_wall", "y": 180 }, "when": { "attachment": "single_wall", "facing": "west" } }
		]
	},
	"assets/minecraft/models/block/bell.json": {
		"textures": {
			"side": "block/bell_side",
			"top": "block/bell_top",
			"bottom": "block/bell_bottom",
			"particle": "block/bell_bottom"
		},
		"elements": [
			{
				"from": [5, 6, 5],
				"to": [11, 13, 11],
				"faces": {
					"north": { "uv": [1, 0, 7, 7], "texture": "#side" },
					"east": { "uv": [1, 0, 7, 7], "texture": "#side" },
					"south": { "uv": [1, 0, 7, 7], "texture": "#side" },
					"west": { "uv": [1, 0, 7, 7], "texture": "#side" },
					"up": { "uv": [8, 8, 0, 0], "texture": "#top" }
				}
			},
			{
				"from": [4, 4, 4],
				"to": [12, 6, 12],
				"faces": {
					"north": { "uv": [0, 7, 8, 9], "texture": "#side" },
					"east": { "uv": [0, 7, 8, 9], "texture": "#side" },
					"south": { "uv": [0, 7, 8, 9], "texture": "#side" },
					"west": { "uv": [0, 7, 8, 9], "texture": "#side" },
					"up": { "uv": [8, 8, 0, 0], "texture": "#top" },
					"down": { "uv": [8, 0, 0, 8], "texture": "#bottom" }
				}
			}
		]
	},
	// ender chest
	"assets/minecraft/models/block/ender_chest.json": { "parent": "block/chest", "textures": { "chest": "entity/chest/ender" } },
	"assets/minecraft/blockstates/ender_chest.json": {
		"variants": {
			"facing=north": { "model": "block/ender_chest" },
			"facing=east": { "model": "block/ender_chest", "y": 90 },
			"facing=south": { "model": "block/ender_chest", "y": 180 },
			"facing=west": { "model": "block/ender_chest", "y": 270 },
		}
	},
	// trapped chest
	"assets/minecraft/models/block/trapped_chest.json": { "parent": "block/chest", "textures": { "chest": "entity/chest/trapped" } },
	"assets/minecraft/blockstates/trapped_chest.json": {
		"variants": {
			"facing=north": { "model": "block/trapped_chest" },
			"facing=east": { "model": "block/trapped_chest", "y": 90 },
			"facing=south": { "model": "block/trapped_chest", "y": 180 },
			"facing=west": { "model": "block/trapped_chest", "y": 270 },
		}
	},
	// copper chest
	"assets/minecraft/models/block/copper_chest.json": { "parent": "block/chest", "textures": { "chest": "entity/chest/copper" } },
	"assets/minecraft/blockstates/copper_chest.json": {
		"variants": {
			"facing=north": { "model": "block/copper_chest" },
			"facing=east": { "model": "block/copper_chest", "y": 90 },
			"facing=south": { "model": "block/copper_chest", "y": 180 },
			"facing=west": { "model": "block/copper_chest", "y": 270 },
		}
	},
	// exposed copper chest
	"assets/minecraft/models/block/exposed_copper_chest.json": { "parent": "block/chest", "textures": { "chest": "entity/chest/copper_exposed" } },
	"assets/minecraft/blockstates/exposed_copper_chest.json": {
		"variants": {
			"facing=north": { "model": "block/exposed_copper_chest" },
			"facing=east": { "model": "block/exposed_copper_chest", "y": 90 },
			"facing=south": { "model": "block/exposed_copper_chest", "y": 180 },
			"facing=west": { "model": "block/exposed_copper_chest", "y": 270 },
		}
	},
	// oxidized copper chest
	"assets/minecraft/models/block/oxidized_copper_chest.json": { "parent": "block/chest", "textures": { "chest": "entity/chest/copper_oxidized" } },
	"assets/minecraft/blockstates/oxidized_copper_chest.json": {
		"variants": {
			"facing=north": { "model": "block/oxidized_copper_chest" },
			"facing=east": { "model": "block/oxidized_copper_chest", "y": 90 },
			"facing=south": { "model": "block/oxidized_copper_chest", "y": 180 },
			"facing=west": { "model": "block/oxidized_copper_chest", "y": 270 },
		}
	},
	// weathered copper chest
	"assets/minecraft/models/block/weathered_copper_chest.json": { "parent": "block/chest", "textures": { "chest": "entity/chest/copper_weathered" } },
	"assets/minecraft/blockstates/weathered_copper_chest.json": {
		"variants": {
			"facing=north": { "model": "block/weathered_copper_chest" },
			"facing=east": { "model": "block/weathered_copper_chest", "y": 90 },
			"facing=south": { "model": "block/weathered_copper_chest", "y": 180 },
			"facing=west": { "model": "block/weathered_copper_chest", "y": 270 },
		}
	},
	// christmas chest
	"assets/minecraft/models/block/christmas_chest.json": { "parent": "block/chest", "textures": { "chest": "entity/chest/christmas" } },
	// chest
	"assets/minecraft/blockstates/chest.json": {
		"variants": {
			"christmas=false,facing=north": { "model": "block/chest" },
			"christmas=false,facing=east": { "model": "block/chest", "y": 90 },
			"christmas=false,facing=south": { "model": "block/chest", "y": 180 },
			"christmas=false,facing=west": { "model": "block/chest", "y": 270 },
			"christmas=true,facing=north": { "model": "block/christmas_chest" },
			"christmas=true,facing=east": { "model": "block/christmas_chest", "y": 90 },
			"christmas=true,facing=south": { "model": "block/christmas_chest", "y": 180 },
			"christmas=true,facing=west": { "model": "block/christmas_chest", "y": 270 },
		}
	},
	"assets/minecraft/models/block/chest.json": {
		"textures": {
			"chest": "entity/chest/normal"
		},
		"elements": [
			{
				"from": [1, 0, 1],
				"to": [15, 10, 15],
				"faces": {
					"north": { "uv": [10.5, 8.25, 14, 10.75], "rotation": 180, "texture": "#chest" },
					"east": { "uv": [10.5, 10.75, 7, 8.25], "texture": "#chest" },
					"south": { "uv": [7, 10.75, 3.5, 8.25], "texture": "#chest" },
					"west": { "uv": [3.5, 10.75, 0, 8.25], "texture": "#chest" },
					"up": { "uv": [10.5, 8.25, 7, 4.75], "texture": "#chest" },
					"down": { "uv": [7, 8.25, 3.5, 4.75], "texture": "#chest" }
				}
			},
			{
				"from": [1, 9, 1],
				"to": [15, 14, 15],
				"faces": {
					"north": { "uv": [14, 4.75, 10.5, 3.5], "texture": "#chest" },
					"east": { "uv": [3.5, 3.5, 7, 4.75], "rotation": 180, "texture": "#chest" },
					"south": { "uv": [3.5, 3.5, 7, 4.75], "rotation": 180, "texture": "#chest" },
					"west": { "uv": [10.5, 4.75, 7, 3.5], "texture": "#chest" },
					"up": { "uv": [10.5, 0, 7, 3.5], "texture": "#chest" },
					"down": { "uv": [7, 0, 3.5, 3.5], "texture": "#chest" }
				}
			},
			{
				"from": [7, 7, 0],
				"to": [9, 11, 1],
				"faces": {
					"north": { "uv": [0.75, 1.25, 0.25, 0.25], "texture": "#chest" },
					"east": { "uv": [0.75, 1.25, 1, 0.25], "texture": "#chest" },
					"south": { "uv": [1, 0.25, 1.5, 1.25], "texture": "#chest" },
					"west": { "uv": [0, 1.25, 0.25, 0.25], "texture": "#chest" },
					"up": { "uv": [0.75, 0.25, 0.25, 0], "texture": "#chest" },
					"down": { "uv": [1.25, 0, 0.75, 0.25], "texture": "#chest" }
				}
			}
		]
	},
	// all shulker box
	"assets/minecraft/models/block/shulker_box.json": {
		"textures": { "box": "entity/shulker/shulker" },
		"elements": [
			{
				"from": [0, 4, 0],
				"to": [16, 16, 16],
				"faces": {
					"north": { "uv": [4, 4, 8, 7], "texture": "#box" },
					"east": { "uv": [0, 4, 4, 7], "texture": "#box" },
					"south": { "uv": [12, 4, 16, 7], "texture": "#box" },
					"west": { "uv": [8, 4, 12, 7], "texture": "#box" },
					"up": { "uv": [8, 4, 4, 0], "texture": "#box" },
					"down": { "uv": [12, 0, 8, 4], "texture": "#box" }
				}
			},
			{
				"from": [0, 0, 0],
				"to": [16, 8, 16],
				"faces": {
					"north": { "uv": [4, 11, 8, 13], "texture": "#box" },
					"east": { "uv": [0, 11, 4, 13], "texture": "#box" },
					"south": { "uv": [12, 11, 16, 13], "texture": "#box" },
					"west": { "uv": [8, 11, 12, 13], "texture": "#box" },
					"up": { "uv": [8, 11, 4, 7], "texture": "#box" },
					"down": { "uv": [12, 7, 8, 11], "texture": "#box" }
				}
			}
		]
	},
	"assets/minecraft/blockstates/shulker_box.json": {
		"variants": {
			"facing=down": { "model": "block/shulker_box", "x": 180 },
			"facing=east": { "model": "block/shulker_box", "x": 90, "y": 90 },
			"facing=north": { "model": "block/shulker_box", "x": 90 },
			"facing=south": { "model": "block/shulker_box", "x": 90, "y": 180 },
			"facing=up": { "model": "block/shulker_box" },
			"facing=west": { "model": "block/shulker_box", "x": 90, "y": 270 }
		}
	},
	"assets/minecraft/blockstates/black_shulker_box.json": {
		"variants": {
			"facing=down": { "model": "block/black_shulker_box", "x": 180 },
			"facing=east": { "model": "block/black_shulker_box", "x": 90, "y": 90 },
			"facing=north": { "model": "block/black_shulker_box", "x": 90 },
			"facing=south": { "model": "block/black_shulker_box", "x": 90, "y": 180 },
			"facing=up": { "model": "block/black_shulker_box" },
			"facing=west": { "model": "block/black_shulker_box", "x": 90, "y": 270 }
		}
	},
	"assets/minecraft/blockstates/red_shulker_box.json": {
		"variants": {
			"facing=down": { "model": "block/red_shulker_box", "x": 180 },
			"facing=east": { "model": "block/red_shulker_box", "x": 90, "y": 90 },
			"facing=north": { "model": "block/red_shulker_box", "x": 90 },
			"facing=south": { "model": "block/red_shulker_box", "x": 90, "y": 180 },
			"facing=up": { "model": "block/red_shulker_box" },
			"facing=west": { "model": "block/red_shulker_box", "x": 90, "y": 270 }
		}
	},
	"assets/minecraft/blockstates/green_shulker_box.json": {
		"variants": {
			"facing=down": { "model": "block/green_shulker_box", "x": 180 },
			"facing=east": { "model": "block/green_shulker_box", "x": 90, "y": 90 },
			"facing=north": { "model": "block/green_shulker_box", "x": 90 },
			"facing=south": { "model": "block/green_shulker_box", "x": 90, "y": 180 },
			"facing=up": { "model": "block/green_shulker_box" },
			"facing=west": { "model": "block/green_shulker_box", "x": 90, "y": 270 }
		}
	},
	"assets/minecraft/blockstates/brown_shulker_box.json": {
		"variants": {
			"facing=down": { "model": "block/brown_shulker_box", "x": 180 },
			"facing=east": { "model": "block/brown_shulker_box", "x": 90, "y": 90 },
			"facing=north": { "model": "block/brown_shulker_box", "x": 90 },
			"facing=south": { "model": "block/brown_shulker_box", "x": 90, "y": 180 },
			"facing=up": { "model": "block/brown_shulker_box" },
			"facing=west": { "model": "block/brown_shulker_box", "x": 90, "y": 270 }
		}
	},
	"assets/minecraft/blockstates/blue_shulker_box.json": {
		"variants": {
			"facing=down": { "model": "block/blue_shulker_box", "x": 180 },
			"facing=east": { "model": "block/blue_shulker_box", "x": 90, "y": 90 },
			"facing=north": { "model": "block/blue_shulker_box", "x": 90 },
			"facing=south": { "model": "block/blue_shulker_box", "x": 90, "y": 180 },
			"facing=up": { "model": "block/blue_shulker_box" },
			"facing=west": { "model": "block/blue_shulker_box", "x": 90, "y": 270 }
		}
	},
	"assets/minecraft/blockstates/purple_shulker_box.json": {
		"variants": {
			"facing=down": { "model": "block/purple_shulker_box", "x": 180 },
			"facing=east": { "model": "block/purple_shulker_box", "x": 90, "y": 90 },
			"facing=north": { "model": "block/purple_shulker_box", "x": 90 },
			"facing=south": { "model": "block/purple_shulker_box", "x": 90, "y": 180 },
			"facing=up": { "model": "block/purple_shulker_box" },
			"facing=west": { "model": "block/purple_shulker_box", "x": 90, "y": 270 }
		}
	},
	"assets/minecraft/blockstates/cyan_shulker_box.json": {
		"variants": {
			"facing=down": { "model": "block/cyan_shulker_box", "x": 180 },
			"facing=east": { "model": "block/cyan_shulker_box", "x": 90, "y": 90 },
			"facing=north": { "model": "block/cyan_shulker_box", "x": 90 },
			"facing=south": { "model": "block/cyan_shulker_box", "x": 90, "y": 180 },
			"facing=up": { "model": "block/cyan_shulker_box" },
			"facing=west": { "model": "block/cyan_shulker_box", "x": 90, "y": 270 }
		}
	},
	"assets/minecraft/blockstates/light_gray_shulker_box.json": {
		"variants": {
			"facing=down": { "model": "block/light_gray_shulker_box", "x": 180 },
			"facing=east": { "model": "block/light_gray_shulker_box", "x": 90, "y": 90 },
			"facing=north": { "model": "block/light_gray_shulker_box", "x": 90 },
			"facing=south": { "model": "block/light_gray_shulker_box", "x": 90, "y": 180 },
			"facing=up": { "model": "block/light_gray_shulker_box" },
			"facing=west": { "model": "block/light_gray_shulker_box", "x": 90, "y": 270 }
		}
	},
	"assets/minecraft/blockstates/gray_shulker_box.json": {
		"variants": {
			"facing=down": { "model": "block/gray_shulker_box", "x": 180 },
			"facing=east": { "model": "block/gray_shulker_box", "x": 90, "y": 90 },
			"facing=north": { "model": "block/gray_shulker_box", "x": 90 },
			"facing=south": { "model": "block/gray_shulker_box", "x": 90, "y": 180 },
			"facing=up": { "model": "block/gray_shulker_box" },
			"facing=west": { "model": "block/gray_shulker_box", "x": 90, "y": 270 }
		}
	},
	"assets/minecraft/blockstates/pink_shulker_box.json": {
		"variants": {
			"facing=down": { "model": "block/pink_shulker_box", "x": 180 },
			"facing=east": { "model": "block/pink_shulker_box", "x": 90, "y": 90 },
			"facing=north": { "model": "block/pink_shulker_box", "x": 90 },
			"facing=south": { "model": "block/pink_shulker_box", "x": 90, "y": 180 },
			"facing=up": { "model": "block/pink_shulker_box" },
			"facing=west": { "model": "block/pink_shulker_box", "x": 90, "y": 270 }
		}
	},
	"assets/minecraft/blockstates/lime_shulker_box.json": {
		"variants": {
			"facing=down": { "model": "block/lime_shulker_box", "x": 180 },
			"facing=east": { "model": "block/lime_shulker_box", "x": 90, "y": 90 },
			"facing=north": { "model": "block/lime_shulker_box", "x": 90 },
			"facing=south": { "model": "block/lime_shulker_box", "x": 90, "y": 180 },
			"facing=up": { "model": "block/lime_shulker_box" },
			"facing=west": { "model": "block/lime_shulker_box", "x": 90, "y": 270 }
		}
	},
	"assets/minecraft/blockstates/yellow_shulker_box.json": {
		"variants": {
			"facing=down": { "model": "block/yellow_shulker_box", "x": 180 },
			"facing=east": { "model": "block/yellow_shulker_box", "x": 90, "y": 90 },
			"facing=north": { "model": "block/yellow_shulker_box", "x": 90 },
			"facing=south": { "model": "block/yellow_shulker_box", "x": 90, "y": 180 },
			"facing=up": { "model": "block/yellow_shulker_box" },
			"facing=west": { "model": "block/yellow_shulker_box", "x": 90, "y": 270 }
		}
	},
	"assets/minecraft/blockstates/light_blue_shulker_box.json": {
		"variants": {
			"facing=down": { "model": "block/light_blue_shulker_box", "x": 180 },
			"facing=east": { "model": "block/light_blue_shulker_box", "x": 90, "y": 90 },
			"facing=north": { "model": "block/light_blue_shulker_box", "x": 90 },
			"facing=south": { "model": "block/light_blue_shulker_box", "x": 90, "y": 180 },
			"facing=up": { "model": "block/light_blue_shulker_box" },
			"facing=west": { "model": "block/light_blue_shulker_box", "x": 90, "y": 270 }
		}
	},
	"assets/minecraft/blockstates/magenta_shulker_box.json": {
		"variants": {
			"facing=down": { "model": "block/magenta_shulker_box", "x": 180 },
			"facing=east": { "model": "block/magenta_shulker_box", "x": 90, "y": 90 },
			"facing=north": { "model": "block/magenta_shulker_box", "x": 90 },
			"facing=south": { "model": "block/magenta_shulker_box", "x": 90, "y": 180 },
			"facing=up": { "model": "block/magenta_shulker_box" },
			"facing=west": { "model": "block/magenta_shulker_box", "x": 90, "y": 270 }
		}
	},
	"assets/minecraft/blockstates/orange_shulker_box.json": {
		"variants": {
			"facing=down": { "model": "block/orange_shulker_box", "x": 180 },
			"facing=east": { "model": "block/orange_shulker_box", "x": 90, "y": 90 },
			"facing=north": { "model": "block/orange_shulker_box", "x": 90 },
			"facing=south": { "model": "block/orange_shulker_box", "x": 90, "y": 180 },
			"facing=up": { "model": "block/orange_shulker_box" },
			"facing=west": { "model": "block/orange_shulker_box", "x": 90, "y": 270 }
		}
	},
	"assets/minecraft/blockstates/white_shulker_box.json": {
		"variants": {
			"facing=down": { "model": "block/white_shulker_box", "x": 180 },
			"facing=east": { "model": "block/white_shulker_box", "x": 90, "y": 90 },
			"facing=north": { "model": "block/white_shulker_box", "x": 90 },
			"facing=south": { "model": "block/white_shulker_box", "x": 90, "y": 180 },
			"facing=up": { "model": "block/white_shulker_box" },
			"facing=west": { "model": "block/white_shulker_box", "x": 90, "y": 270 }
		}
	},
	"assets/minecraft/models/block/black_shulker_box.json": {
		"parent": "block/shulker_box",
		"textures": { "box": "entity/shulker/shulker_black" }
	},
	"assets/minecraft/models/block/red_shulker_box.json": {
		"parent": "block/shulker_box",
		"textures": { "box": "entity/shulker/shulker_red" }
	},
	"assets/minecraft/models/block/green_shulker_box.json": {
		"parent": "block/shulker_box",
		"textures": { "box": "entity/shulker/shulker_green" }
	},
	"assets/minecraft/models/block/brown_shulker_box.json": {
		"parent": "block/shulker_box",
		"textures": { "box": "entity/shulker/shulker_brown" }
	},
	"assets/minecraft/models/block/blue_shulker_box.json": {
		"parent": "block/shulker_box",
		"textures": { "box": "entity/shulker/shulker_blue" }
	},
	"assets/minecraft/models/block/purple_shulker_box.json": {
		"parent": "block/shulker_box",
		"textures": { "box": "entity/shulker/shulker_purple" }
	},
	"assets/minecraft/models/block/cyan_shulker_box.json": {
		"parent": "block/shulker_box",
		"textures": { "box": "entity/shulker/shulker_cyan" }
	},
	"assets/minecraft/models/block/light_gray_shulker_box.json": {
		"parent": "block/shulker_box",
		"textures": { "box": "entity/shulker/shulker_light_gray" }
	},
	"assets/minecraft/models/block/gray_shulker_box.json": {
		"parent": "block/shulker_box",
		"textures": { "box": "entity/shulker/shulker_gray" }
	},
	"assets/minecraft/models/block/pink_shulker_box.json": {
		"parent": "block/shulker_box",
		"textures": { "box": "entity/shulker/shulker_pink" }
	},
	"assets/minecraft/models/block/lime_shulker_box.json": {
		"parent": "block/shulker_box",
		"textures": { "box": "entity/shulker/shulker_lime" }
	},
	"assets/minecraft/models/block/yellow_shulker_box.json": {
		"parent": "block/shulker_box",
		"textures": { "box": "entity/shulker/shulker_yellow" }
	},
	"assets/minecraft/models/block/light_blue_shulker_box.json": {
		"parent": "block/shulker_box",
		"textures": { "box": "entity/shulker/shulker_light_blue" }
	},
	"assets/minecraft/models/block/magenta_shulker_box.json": {
		"parent": "block/shulker_box",
		"textures": { "box": "entity/shulker/shulker_magenta" }
	},
	"assets/minecraft/models/block/orange_shulker_box.json": {
		"parent": "block/shulker_box",
		"textures": { "box": "entity/shulker/shulker_orange" }
	},
	"assets/minecraft/models/block/white_shulker_box.json": {
		"parent": "block/shulker_box",
		"textures": { "box": "entity/shulker/shulker_white" }
	},
	// banners (Note: These blockstates are custom and not available in vanilla.)
	"assets/minecraft/blockstates/white_banner.json": { "variants": { "": { "model": "block/banner", "diffuse": { "texture": "#flag", "color": "white" } } } },
	"assets/minecraft/blockstates/orange_banner.json": { "variants": { "": { "model": "block/banner", "diffuse": { "texture": "#flag", "color": "orange" } } } },
	"assets/minecraft/blockstates/magenta_banner.json": { "variants": { "": { "model": "block/banner", "diffuse": { "texture": "#flag", "color": "magenta" } } } },
	"assets/minecraft/blockstates/light_blue_banner.json": { "variants": { "": { "model": "block/banner", "diffuse": { "texture": "#flag", "color": "light_blue" } } } },
	"assets/minecraft/blockstates/yellow_banner.json": { "variants": { "": { "model": "block/banner", "diffuse": { "texture": "#flag", "color": "yellow" } } } },
	"assets/minecraft/blockstates/lime_banner.json": { "variants": { "": { "model": "block/banner", "diffuse": { "texture": "#flag", "color": "lime" } } } },
	"assets/minecraft/blockstates/pink_banner.json": { "variants": { "": { "model": "block/banner", "diffuse": { "texture": "#flag", "color": "pink" } } } },
	"assets/minecraft/blockstates/gray_banner.json": { "variants": { "": { "model": "block/banner", "diffuse": { "texture": "#flag", "color": "gray" } } } },
	"assets/minecraft/blockstates/light_gray_banner.json": { "variants": { "": { "model": "block/banner", "diffuse": { "texture": "#flag", "color": "light_gray" } } } },
	"assets/minecraft/blockstates/cyan_banner.json": { "variants": { "": { "model": "block/banner", "diffuse": { "texture": "#flag", "color": "cyan" } } } },
	"assets/minecraft/blockstates/purple_banner.json": { "variants": { "": { "model": "block/banner", "diffuse": { "texture": "#flag", "color": "purple" } } } },
	"assets/minecraft/blockstates/blue_banner.json": { "variants": { "": { "model": "block/banner", "diffuse": { "texture": "#flag", "color": "blue" } } } },
	"assets/minecraft/blockstates/brown_banner.json": { "variants": { "": { "model": "block/banner", "diffuse": { "texture": "#flag", "color": "brown" } } } },
	"assets/minecraft/blockstates/green_banner.json": { "variants": { "": { "model": "block/banner", "diffuse": { "texture": "#flag", "color": "green" } } } },
	"assets/minecraft/blockstates/red_banner.json": { "variants": { "": { "model": "block/banner", "diffuse": { "texture": "#flag", "color": "red" } } } },
	"assets/minecraft/blockstates/black_banner.json": { "variants": { "": { "model": "block/banner", "diffuse": { "texture": "#flag", "color": "black" } } } },
	"assets/minecraft/models/block/banner.json": {
		"textures": {
			"base": "entity/banner_base",
			"flag": "entity/banner/base"
		},
		"elements": [
			{
				"from": [7.33334, 0, 7.33334],
				"to": [8.66667, 28, 8.66667],
				"faces": {
					"north": { "uv": [12.5, 0.5, 13, 11], "texture": "#base" },
					"east": { "uv": [12, 0.5, 12.5, 11], "texture": "#base" },
					"south": { "uv": [11.5, 0.5, 12, 11], "texture": "#base" },
					"west": { "uv": [11, 0.5, 11.5, 11], "texture": "#base" },
					"up": { "uv": [12, 0.5, 11.5, 0], "rotation": 180, "texture": "#base" },
					"down": { "uv": [12.5, 0, 12, 0.5], "rotation": 180, "texture": "#base" }
				}
			},
			{
				"from": [1.33337, 28, 7.33333],
				"to": [14.6667, 29.33333, 8.66667],
				"faces": {
					"north": { "uv": [6, 11, 11, 11.5], "texture": "#base" },
					"east": { "uv": [5.5, 11, 6, 11.5], "texture": "#base" },
					"south": { "uv": [0.5, 11, 5.5, 11.5], "texture": "#base" },
					"west": { "uv": [0, 11, 0.5, 11.5], "texture": "#base" },
					"up": { "uv": [5.5, 11, 0.5, 10.5], "rotation": 180, "texture": "#base" },
					"down": { "uv": [10.5, 10.5, 5.5, 11], "rotation": 180, "texture": "#base" }
				}
			},
			{
				"from": [1.33333, 1.33333, 8.66667],
				"to": [14.66667, 29.33333, 9.33333],
				"rotation": { "angle": 0, "axis": "y", "origin": [8, 8, 8] },
				"faces": {
					"north": { "uv": [5.5, 0.25, 10.5, 10.25], "texture": "#flag" },
					"east": { "uv": [5.25, 0.25, 5.5, 10.25], "texture": "#flag" },
					"south": { "uv": [0.25, 0.25, 5.25, 10.25], "texture": "#flag" },
					"west": { "uv": [0, 0.25, 0.25, 10.25], "texture": "#flag" },
					"up": { "uv": [5.25, 0.25, 0.25, 0], "rotation": 180, "texture": "#flag" },
					"down": { "uv": [10.25, 0, 5.25, 0.25], "rotation": 180, "texture": "#flag" }
				}
			}
		]
	},
	// wall banners (Note: These blockstates are custom and not available in vanilla.)
	"assets/minecraft/blockstates/white_wall_banner.json": { "variants": { "": { "model": "block/wall_banner", "diffuse": { "texture": "#flag", "color": "white" } } } },
	"assets/minecraft/blockstates/orange_wall_banner.json": { "variants": { "": { "model": "block/wall_banner", "diffuse": { "texture": "#flag", "color": "orange" } } } },
	"assets/minecraft/blockstates/magenta_wall_banner.json": { "variants": { "": { "model": "block/wall_banner", "diffuse": { "texture": "#flag", "color": "magenta" } } } },
	"assets/minecraft/blockstates/light_blue_wall_banner.json": { "variants": { "": { "model": "block/wall_banner", "diffuse": { "texture": "#flag", "color": "light_blue" } } } },
	"assets/minecraft/blockstates/yellow_wall_banner.json": { "variants": { "": { "model": "block/wall_banner", "diffuse": { "texture": "#flag", "color": "yellow" } } } },
	"assets/minecraft/blockstates/lime_wall_banner.json": { "variants": { "": { "model": "block/wall_banner", "diffuse": { "texture": "#flag", "color": "lime" } } } },
	"assets/minecraft/blockstates/pink_wall_banner.json": { "variants": { "": { "model": "block/wall_banner", "diffuse": { "texture": "#flag", "color": "pink" } } } },
	"assets/minecraft/blockstates/gray_wall_banner.json": { "variants": { "": { "model": "block/wall_banner", "diffuse": { "texture": "#flag", "color": "gray" } } } },
	"assets/minecraft/blockstates/light_gray_wall_banner.json": { "variants": { "": { "model": "block/wall_banner", "diffuse": { "texture": "#flag", "color": "light_gray" } } } },
	"assets/minecraft/blockstates/cyan_wall_banner.json": { "variants": { "": { "model": "block/wall_banner", "diffuse": { "texture": "#flag", "color": "cyan" } } } },
	"assets/minecraft/blockstates/purple_wall_banner.json": { "variants": { "": { "model": "block/wall_banner", "diffuse": { "texture": "#flag", "color": "purple" } } } },
	"assets/minecraft/blockstates/blue_wall_banner.json": { "variants": { "": { "model": "block/wall_banner", "diffuse": { "texture": "#flag", "color": "blue" } } } },
	"assets/minecraft/blockstates/brown_wall_banner.json": { "variants": { "": { "model": "block/wall_banner", "diffuse": { "texture": "#flag", "color": "brown" } } } },
	"assets/minecraft/blockstates/green_wall_banner.json": { "variants": { "": { "model": "block/wall_banner", "diffuse": { "texture": "#flag", "color": "green" } } } },
	"assets/minecraft/blockstates/red_wall_banner.json": { "variants": { "": { "model": "block/wall_banner", "diffuse": { "texture": "#flag", "color": "red" } } } },
	"assets/minecraft/blockstates/black_wall_banner.json": { "variants": { "": { "model": "block/wall_banner", "diffuse": { "texture": "#flag", "color": "black" } } } },
	"assets/minecraft/models/block/wall_banner.json": {
		"textures": {
			"flag": "entity/banner/base"
		},
		"elements": [
			{
				"from": [1.33333, -12, 15.33333],
				"to": [14.66667, 16, 15.99999],
				"rotation": { "angle": 0, "axis": "x", "origin": [8, 16, 16] },
				"faces": {
					"north": { "uv": [0.25, 0.25, 5.25, 10.25], "texture": "#flag" },
					"east": { "uv": [0, 0.25, 0.25, 10.25], "texture": "#flag" },
					"south": { "uv": [5.5, 0.25, 10.5, 10.25], "texture": "#flag" },
					"west": { "uv": [5.25, 0.25, 5.5, 10.25], "texture": "#flag" },
					"up": { "uv": [5.25, 0.25, 0.25, 0], "texture": "#flag" },
					"down": { "uv": [10.25, 0, 5.25, 0.25], "texture": "#flag" }
				}
			}
		]
	},
	// beds
	"assets/minecraft/blockstates/white_bed.json": {
		"variants": {
			"foot=false,facing=north": { "model": "block/white_bed_head" },
			"foot=false,facing=east": { "model": "block/white_bed_head", "y": 90 },
			"foot=false,facing=south": { "model": "block/white_bed_head", "y": 180 },
			"foot=false,facing=west": { "model": "block/white_bed_head", "y": 270 },
			"foot=true,facing=north": { "model": "block/white_bed_foot" },
			"foot=true,facing=east": { "model": "block/white_bed_foot", "y": 90 },
			"foot=true,facing=south": { "model": "block/white_bed_foot", "y": 180 },
			"foot=true,facing=west": { "model": "block/white_bed_foot", "y": 270 }
		}
	},
	"assets/minecraft/blockstates/orange_bed.json": {
		"variants": {
			"foot=false,facing=north": { "model": "block/orange_bed_head" },
			"foot=false,facing=east": { "model": "block/orange_bed_head", "y": 90 },
			"foot=false,facing=south": { "model": "block/orange_bed_head", "y": 180 },
			"foot=false,facing=west": { "model": "block/orange_bed_head", "y": 270 },
			"foot=true,facing=north": { "model": "block/orange_bed_foot" },
			"foot=true,facing=east": { "model": "block/orange_bed_foot", "y": 90 },
			"foot=true,facing=south": { "model": "block/orange_bed_foot", "y": 180 },
			"foot=true,facing=west": { "model": "block/orange_bed_foot", "y": 270 }
		}
	},
	"assets/minecraft/blockstates/magenta_bed.json": {
		"variants": {
			"foot=false,facing=north": { "model": "block/magenta_bed_head" },
			"foot=false,facing=east": { "model": "block/magenta_bed_head", "y": 90 },
			"foot=false,facing=south": { "model": "block/magenta_bed_head", "y": 180 },
			"foot=false,facing=west": { "model": "block/magenta_bed_head", "y": 270 },
			"foot=true,facing=north": { "model": "block/magenta_bed_foot" },
			"foot=true,facing=east": { "model": "block/magenta_bed_foot", "y": 90 },
			"foot=true,facing=south": { "model": "block/magenta_bed_foot", "y": 180 },
			"foot=true,facing=west": { "model": "block/magenta_bed_foot", "y": 270 }
		}
	},
	"assets/minecraft/blockstates/light_blue_bed.json": {
		"variants": {
			"foot=false,facing=north": { "model": "block/light_blue_bed_head" },
			"foot=false,facing=east": { "model": "block/light_blue_bed_head", "y": 90 },
			"foot=false,facing=south": { "model": "block/light_blue_bed_head", "y": 180 },
			"foot=false,facing=west": { "model": "block/light_blue_bed_head", "y": 270 },
			"foot=true,facing=north": { "model": "block/light_blue_bed_foot" },
			"foot=true,facing=east": { "model": "block/light_blue_bed_foot", "y": 90 },
			"foot=true,facing=south": { "model": "block/light_blue_bed_foot", "y": 180 },
			"foot=true,facing=west": { "model": "block/light_blue_bed_foot", "y": 270 }
		}
	},
	"assets/minecraft/blockstates/yellow_bed.json": {
		"variants": {
			"foot=false,facing=north": { "model": "block/yellow_bed_head" },
			"foot=false,facing=east": { "model": "block/yellow_bed_head", "y": 90 },
			"foot=false,facing=south": { "model": "block/yellow_bed_head", "y": 180 },
			"foot=false,facing=west": { "model": "block/yellow_bed_head", "y": 270 },
			"foot=true,facing=north": { "model": "block/yellow_bed_foot" },
			"foot=true,facing=east": { "model": "block/yellow_bed_foot", "y": 90 },
			"foot=true,facing=south": { "model": "block/yellow_bed_foot", "y": 180 },
			"foot=true,facing=west": { "model": "block/yellow_bed_foot", "y": 270 }
		}
	},
	"assets/minecraft/blockstates/lime_bed.json": {
		"variants": {
			"foot=false,facing=north": { "model": "block/lime_bed_head" },
			"foot=false,facing=east": { "model": "block/lime_bed_head", "y": 90 },
			"foot=false,facing=south": { "model": "block/lime_bed_head", "y": 180 },
			"foot=false,facing=west": { "model": "block/lime_bed_head", "y": 270 },
			"foot=true,facing=north": { "model": "block/lime_bed_foot" },
			"foot=true,facing=east": { "model": "block/lime_bed_foot", "y": 90 },
			"foot=true,facing=south": { "model": "block/lime_bed_foot", "y": 180 },
			"foot=true,facing=west": { "model": "block/lime_bed_foot", "y": 270 }
		}
	},
	"assets/minecraft/blockstates/pink_bed.json": {
		"variants": {
			"foot=false,facing=north": { "model": "block/pink_bed_head" },
			"foot=false,facing=east": { "model": "block/pink_bed_head", "y": 90 },
			"foot=false,facing=south": { "model": "block/pink_bed_head", "y": 180 },
			"foot=false,facing=west": { "model": "block/pink_bed_head", "y": 270 },
			"foot=true,facing=north": { "model": "block/pink_bed_foot" },
			"foot=true,facing=east": { "model": "block/pink_bed_foot", "y": 90 },
			"foot=true,facing=south": { "model": "block/pink_bed_foot", "y": 180 },
			"foot=true,facing=west": { "model": "block/pink_bed_foot", "y": 270 }
		}
	},
	"assets/minecraft/blockstates/gray_bed.json": {
		"variants": {
			"foot=false,facing=north": { "model": "block/gray_bed_head" },
			"foot=false,facing=east": { "model": "block/gray_bed_head", "y": 90 },
			"foot=false,facing=south": { "model": "block/gray_bed_head", "y": 180 },
			"foot=false,facing=west": { "model": "block/gray_bed_head", "y": 270 },
			"foot=true,facing=north": { "model": "block/gray_bed_foot" },
			"foot=true,facing=east": { "model": "block/gray_bed_foot", "y": 90 },
			"foot=true,facing=south": { "model": "block/gray_bed_foot", "y": 180 },
			"foot=true,facing=west": { "model": "block/gray_bed_foot", "y": 270 }
		}
	},
	"assets/minecraft/blockstates/light_gray_bed.json": {
		"variants": {
			"foot=false,facing=north": { "model": "block/light_gray_bed_head" },
			"foot=false,facing=east": { "model": "block/light_gray_bed_head", "y": 90 },
			"foot=false,facing=south": { "model": "block/light_gray_bed_head", "y": 180 },
			"foot=false,facing=west": { "model": "block/light_gray_bed_head", "y": 270 },
			"foot=true,facing=north": { "model": "block/light_gray_bed_foot" },
			"foot=true,facing=east": { "model": "block/light_gray_bed_foot", "y": 90 },
			"foot=true,facing=south": { "model": "block/light_gray_bed_foot", "y": 180 },
			"foot=true,facing=west": { "model": "block/light_gray_bed_foot", "y": 270 }
		}
	},
	"assets/minecraft/blockstates/cyan_bed.json": {
		"variants": {
			"foot=false,facing=north": { "model": "block/cyan_bed_head" },
			"foot=false,facing=east": { "model": "block/cyan_bed_head", "y": 90 },
			"foot=false,facing=south": { "model": "block/cyan_bed_head", "y": 180 },
			"foot=false,facing=west": { "model": "block/cyan_bed_head", "y": 270 },
			"foot=true,facing=north": { "model": "block/cyan_bed_foot" },
			"foot=true,facing=east": { "model": "block/cyan_bed_foot", "y": 90 },
			"foot=true,facing=south": { "model": "block/cyan_bed_foot", "y": 180 },
			"foot=true,facing=west": { "model": "block/cyan_bed_foot", "y": 270 }
		}
	},
	"assets/minecraft/blockstates/purple_bed.json": {
		"variants": {
			"foot=false,facing=north": { "model": "block/purple_bed_head" },
			"foot=false,facing=east": { "model": "block/purple_bed_head", "y": 90 },
			"foot=false,facing=south": { "model": "block/purple_bed_head", "y": 180 },
			"foot=false,facing=west": { "model": "block/purple_bed_head", "y": 270 },
			"foot=true,facing=north": { "model": "block/purple_bed_foot" },
			"foot=true,facing=east": { "model": "block/purple_bed_foot", "y": 90 },
			"foot=true,facing=south": { "model": "block/purple_bed_foot", "y": 180 },
			"foot=true,facing=west": { "model": "block/purple_bed_foot", "y": 270 }
		}
	},
	"assets/minecraft/blockstates/blue_bed.json": {
		"variants": {
			"foot=false,facing=north": { "model": "block/blue_bed_head" },
			"foot=false,facing=east": { "model": "block/blue_bed_head", "y": 90 },
			"foot=false,facing=south": { "model": "block/blue_bed_head", "y": 180 },
			"foot=false,facing=west": { "model": "block/blue_bed_head", "y": 270 },
			"foot=true,facing=north": { "model": "block/blue_bed_foot" },
			"foot=true,facing=east": { "model": "block/blue_bed_foot", "y": 90 },
			"foot=true,facing=south": { "model": "block/blue_bed_foot", "y": 180 },
			"foot=true,facing=west": { "model": "block/blue_bed_foot", "y": 270 }
		}
	},
	"assets/minecraft/blockstates/brown_bed.json": {
		"variants": {
			"foot=false,facing=north": { "model": "block/brown_bed_head" },
			"foot=false,facing=east": { "model": "block/brown_bed_head", "y": 90 },
			"foot=false,facing=south": { "model": "block/brown_bed_head", "y": 180 },
			"foot=false,facing=west": { "model": "block/brown_bed_head", "y": 270 },
			"foot=true,facing=north": { "model": "block/brown_bed_foot" },
			"foot=true,facing=east": { "model": "block/brown_bed_foot", "y": 90 },
			"foot=true,facing=south": { "model": "block/brown_bed_foot", "y": 180 },
			"foot=true,facing=west": { "model": "block/brown_bed_foot", "y": 270 }
		}
	},
	"assets/minecraft/blockstates/green_bed.json": {
		"variants": {
			"foot=false,facing=north": { "model": "block/green_bed_head" },
			"foot=false,facing=east": { "model": "block/green_bed_head", "y": 90 },
			"foot=false,facing=south": { "model": "block/green_bed_head", "y": 180 },
			"foot=false,facing=west": { "model": "block/green_bed_head", "y": 270 },
			"foot=true,facing=north": { "model": "block/green_bed_foot" },
			"foot=true,facing=east": { "model": "block/green_bed_foot", "y": 90 },
			"foot=true,facing=south": { "model": "block/green_bed_foot", "y": 180 },
			"foot=true,facing=west": { "model": "block/green_bed_foot", "y": 270 }
		}
	},
	"assets/minecraft/blockstates/red_bed.json": {
		"variants": {
			"foot=false,facing=north": { "model": "block/red_bed_head" },
			"foot=false,facing=east": { "model": "block/red_bed_head", "y": 90 },
			"foot=false,facing=south": { "model": "block/red_bed_head", "y": 180 },
			"foot=false,facing=west": { "model": "block/red_bed_head", "y": 270 },
			"foot=true,facing=north": { "model": "block/red_bed_foot" },
			"foot=true,facing=east": { "model": "block/red_bed_foot", "y": 90 },
			"foot=true,facing=south": { "model": "block/red_bed_foot", "y": 180 },
			"foot=true,facing=west": { "model": "block/red_bed_foot", "y": 270 }
		}
	},
	"assets/minecraft/blockstates/black_bed.json": {
		"variants": {
			"foot=false,facing=north": { "model": "block/black_bed_head" },
			"foot=false,facing=east": { "model": "block/black_bed_head", "y": 90 },
			"foot=false,facing=south": { "model": "block/black_bed_head", "y": 180 },
			"foot=false,facing=west": { "model": "block/black_bed_head", "y": 270 },
			"foot=true,facing=north": { "model": "block/black_bed_foot" },
			"foot=true,facing=east": { "model": "block/black_bed_foot", "y": 90 },
			"foot=true,facing=south": { "model": "block/black_bed_foot", "y": 180 },
			"foot=true,facing=west": { "model": "block/black_bed_foot", "y": 270 }
		}
	},
	// bed block model head
	"assets/minecraft/models/block/white_bed_head.json": { "parent": "block/bed_head", "textures": { "bed": "entity/bed/white" } },
	"assets/minecraft/models/block/orange_bed_head.json": { "parent": "block/bed_head", "textures": { "bed": "entity/bed/orange" } },
	"assets/minecraft/models/block/magenta_bed_head.json": { "parent": "block/bed_head", "textures": { "bed": "entity/bed/magenta" } },
	"assets/minecraft/models/block/light_blue_bed_head.json": { "parent": "block/bed_head", "textures": { "bed": "entity/bed/light_blue" } },
	"assets/minecraft/models/block/yellow_bed_head.json": { "parent": "block/bed_head", "textures": { "bed": "entity/bed/yellow" } },
	"assets/minecraft/models/block/lime_bed_head.json": { "parent": "block/bed_head", "textures": { "bed": "entity/bed/lime" } },
	"assets/minecraft/models/block/pink_bed_head.json": { "parent": "block/bed_head", "textures": { "bed": "entity/bed/pink" } },
	"assets/minecraft/models/block/gray_bed_head.json": { "parent": "block/bed_head", "textures": { "bed": "entity/bed/gray" } },
	"assets/minecraft/models/block/light_gray_bed_head.json": { "parent": "block/bed_head", "textures": { "bed": "entity/bed/light_gray" } },
	"assets/minecraft/models/block/cyan_bed_head.json": { "parent": "block/bed_head", "textures": { "bed": "entity/bed/cyan" } },
	"assets/minecraft/models/block/purple_bed_head.json": { "parent": "block/bed_head", "textures": { "bed": "entity/bed/purple" } },
	"assets/minecraft/models/block/blue_bed_head.json": { "parent": "block/bed_head", "textures": { "bed": "entity/bed/blue" } },
	"assets/minecraft/models/block/brown_bed_head.json": { "parent": "block/bed_head", "textures": { "bed": "entity/bed/brown" } },
	"assets/minecraft/models/block/green_bed_head.json": { "parent": "block/bed_head", "textures": { "bed": "entity/bed/green" } },
	"assets/minecraft/models/block/red_bed_head.json": { "parent": "block/bed_head", "textures": { "bed": "entity/bed/red" } },
	"assets/minecraft/models/block/black_bed_head.json": { "parent": "block/bed_head", "textures": { "bed": "entity/bed/black" } },
	// bed block model foot
	"assets/minecraft/models/block/white_bed_foot.json": { "parent": "block/bed_foot", "textures": { "bed": "entity/bed/white" } },
	"assets/minecraft/models/block/orange_bed_foot.json": { "parent": "block/bed_foot", "textures": { "bed": "entity/bed/orange" } },
	"assets/minecraft/models/block/magenta_bed_foot.json": { "parent": "block/bed_foot", "textures": { "bed": "entity/bed/magenta" } },
	"assets/minecraft/models/block/light_blue_bed_foot.json": { "parent": "block/bed_foot", "textures": { "bed": "entity/bed/light_blue" } },
	"assets/minecraft/models/block/yellow_bed_foot.json": { "parent": "block/bed_foot", "textures": { "bed": "entity/bed/yellow" } },
	"assets/minecraft/models/block/lime_bed_foot.json": { "parent": "block/bed_foot", "textures": { "bed": "entity/bed/lime" } },
	"assets/minecraft/models/block/pink_bed_foot.json": { "parent": "block/bed_foot", "textures": { "bed": "entity/bed/pink" } },
	"assets/minecraft/models/block/gray_bed_foot.json": { "parent": "block/bed_foot", "textures": { "bed": "entity/bed/gray" } },
	"assets/minecraft/models/block/light_gray_bed_foot.json": { "parent": "block/bed_foot", "textures": { "bed": "entity/bed/light_gray" } },
	"assets/minecraft/models/block/cyan_bed_foot.json": { "parent": "block/bed_foot", "textures": { "bed": "entity/bed/cyan" } },
	"assets/minecraft/models/block/purple_bed_foot.json": { "parent": "block/bed_foot", "textures": { "bed": "entity/bed/purple" } },
	"assets/minecraft/models/block/blue_bed_foot.json": { "parent": "block/bed_foot", "textures": { "bed": "entity/bed/blue" } },
	"assets/minecraft/models/block/brown_bed_foot.json": { "parent": "block/bed_foot", "textures": { "bed": "entity/bed/brown" } },
	"assets/minecraft/models/block/green_bed_foot.json": { "parent": "block/bed_foot", "textures": { "bed": "entity/bed/green" } },
	"assets/minecraft/models/block/red_bed_foot.json": { "parent": "block/bed_foot", "textures": { "bed": "entity/bed/red" } },
	"assets/minecraft/models/block/black_bed_foot.json": { "parent": "block/bed_foot", "textures": { "bed": "entity/bed/black" } },
	// bed head
	"assets/minecraft/models/block/bed_head.json": {
		"elements": [
			{
				"from": [0, 3, 0],
				"to": [16, 9, 16],
				"faces": {
					"north": { "uv": [9.5, 0, 5.5, 1.5], "rotation": 180, "texture": "#bed" },
					"east": { "uv": [0, 1.5, 1.5, 5.5], "rotation": 270, "texture": "#bed" },
					"south": { "uv": [5.5, 1.5, 1.5, 0], "texture": "#bed" },
					"west": { "uv": [5.5, 1.5, 7, 5.5], "rotation": 90, "texture": "#bed" },
					"up": { "uv": [1.5, 1.5, 5.5, 5.5], "rotation": 180, "texture": "#bed" },
					"down": { "uv": [7, 1.5, 11, 5.5], "texture": "#bed" }
				}
			},
			{
				"from": [0, 0, 13],
				"to": [3, 3, 16],
				"faces": {
					"north": { "uv": [14.75, 3.75, 15.5, 4.5], "texture": "#bed" },
					"east": { "uv": [14, 3.75, 14.75, 4.5], "texture": "#bed" },
					"south": { "uv": [13.25, 3.75, 14, 4.5], "texture": "#bed" },
					"west": { "uv": [12.5, 3.75, 13.25, 4.5], "texture": "#bed" },
					"up": { "uv": [14, 3.75, 13.25, 3], "rotation": 180, "texture": "#bed" },
					"down": { "uv": [14.75, 3, 14, 3.75], "rotation": 180, "texture": "#bed" }
				}
			},
			{
				"from": [13, 0, 13],
				"to": [16, 3, 16],
				"faces": {
					"north": { "uv": [14, 5.25, 14.75, 6], "texture": "#bed" },
					"east": { "uv": [13.25, 5.25, 14, 6], "texture": "#bed" },
					"south": { "uv": [12.5, 5.25, 13.25, 6], "texture": "#bed" },
					"west": { "uv": [14.75, 5.25, 15.5, 6], "texture": "#bed" },
					"up": { "uv": [14, 5.25, 13.25, 4.5], "rotation": 90, "texture": "#bed" },
					"down": { "uv": [14.75, 4.5, 14, 5.25], "rotation": 270, "texture": "#bed" }
				}
			}
		]
	},
	// bed foot
	"assets/minecraft/models/block/bed_foot.json": {
		"textures": {
			"bed": "entity/bed/white"
		},
		"elements": [
			{
				"from": [0, 3, 0],
				"to": [16, 9, 16],
				"faces": {
					"north": { "uv": [9.5, 5.5, 5.5, 7], "rotation": 180, "texture": "#bed" },
					"east": { "uv": [0, 7, 1.5, 11], "rotation": 270, "texture": "#bed" },
					"south": { "uv": [5.5, 7, 1.5, 5.5], "texture": "#bed" },
					"west": { "uv": [5.5, 7, 7, 11], "rotation": 90, "texture": "#bed" },
					"up": { "uv": [1.5, 7, 5.5, 11], "rotation": 180, "texture": "#bed" },
					"down": { "uv": [7, 7, 11, 11], "texture": "#bed" }
				}
			},
			{
				"from": [0, 0, 0],
				"to": [3, 3, 3],
				"faces": {
					"north": { "uv": [12.5, 0.75, 13.25, 1.5], "texture": "#bed" },
					"east": { "uv": [14.75, 0.75, 15.5, 1.5], "texture": "#bed" },
					"south": { "uv": [14, 0.75, 14.75, 1.5], "texture": "#bed" },
					"west": { "uv": [13.25, 0.75, 14, 1.5], "texture": "#bed" },
					"up": { "uv": [14, 0.75, 13.25, 0], "rotation": 270, "texture": "#bed" },
					"down": { "uv": [14.75, 0, 14, 0.75], "rotation": 90, "texture": "#bed" }
				}
			},
			{
				"from": [13, 0, 0],
				"to": [16, 3, 3],
				"faces": {
					"north": { "uv": [13.25, 2.25, 14, 3], "texture": "#bed" },
					"east": { "uv": [12.5, 2.25, 13.25, 3], "texture": "#bed" },
					"south": { "uv": [14.75, 2.25, 15.5, 3], "texture": "#bed" },
					"west": { "uv": [14, 2.25, 14.75, 3], "texture": "#bed" },
					"up": { "uv": [14, 2.25, 13.25, 1.5], "texture": "#bed" },
					"down": { "uv": [14.75, 1.5, 14, 2.25], "texture": "#bed" }
				}
			}
		]
	},
	// decorated pot
	"assets/minecraft/blockstates/decorated_pot.json": {
		"multipart": [
			{
				"apply": {
					"model": "block/decorated_pot"
				},
				"when": {
					"north": "none|angler|archer|arms_up|blade|brewer|burn|danger|explorer|flow|friend|guster|heartbreak|heart|howl|miner|mourner|plenty|prize|scrape|sheaf|shelter|skull|snort",
					"east": "none|angler|archer|arms_up|blade|brewer|burn|danger|explorer|flow|friend|guster|heartbreak|heart|howl|miner|mourner|plenty|prize|scrape|sheaf|shelter|skull|snort",
					"south": "none|angler|archer|arms_up|blade|brewer|burn|danger|explorer|flow|friend|guster|heartbreak|heart|howl|miner|mourner|plenty|prize|scrape|sheaf|shelter|skull|snort",
					"west": "none|angler|archer|arms_up|blade|brewer|burn|danger|explorer|flow|friend|guster|heartbreak|heart|howl|miner|mourner|plenty|prize|scrape|sheaf|shelter|skull|snort"
				}
			},
			{ "apply": { "model": "block/decorated_pot_north" }, "when": { "north": "none" } },
			{ "apply": { "model": "block/decorated_pot_east" }, "when": { "east": "none" } },
			{ "apply": { "model": "block/decorated_pot_south" }, "when": { "south": "none" } },
			{ "apply": { "model": "block/decorated_pot_west" }, "when": { "west": "none" } },

			{ "apply": { "model": "block/decorated_pot_north_angler" }, "when": { "north": "angler" } },
			{ "apply": { "model": "block/decorated_pot_north_archer" }, "when": { "north": "archer" } },
			{ "apply": { "model": "block/decorated_pot_north_arms_up" }, "when": { "north": "arms_up" } },
			{ "apply": { "model": "block/decorated_pot_north_blade" }, "when": { "north": "blade" } },
			{ "apply": { "model": "block/decorated_pot_north_brewer" }, "when": { "north": "brewer" } },
			{ "apply": { "model": "block/decorated_pot_north_burn" }, "when": { "north": "burn" } },
			{ "apply": { "model": "block/decorated_pot_north_danger" }, "when": { "north": "danger" } },
			{ "apply": { "model": "block/decorated_pot_north_explorer" }, "when": { "north": "explorer" } },
			{ "apply": { "model": "block/decorated_pot_north_flow" }, "when": { "north": "flow" } },
			{ "apply": { "model": "block/decorated_pot_north_friend" }, "when": { "north": "friend" } },
			{ "apply": { "model": "block/decorated_pot_north_guster" }, "when": { "north": "guster" } },
			{ "apply": { "model": "block/decorated_pot_north_heartbreak" }, "when": { "north": "heartbreak" } },
			{ "apply": { "model": "block/decorated_pot_north_heart" }, "when": { "north": "heart" } },
			{ "apply": { "model": "block/decorated_pot_north_howl" }, "when": { "north": "howl" } },
			{ "apply": { "model": "block/decorated_pot_north_miner" }, "when": { "north": "miner" } },
			{ "apply": { "model": "block/decorated_pot_north_mourner" }, "when": { "north": "mourner" } },
			{ "apply": { "model": "block/decorated_pot_north_plenty" }, "when": { "north": "plenty" } },
			{ "apply": { "model": "block/decorated_pot_north_prize" }, "when": { "north": "prize" } },
			{ "apply": { "model": "block/decorated_pot_north_scrape" }, "when": { "north": "scrape" } },
			{ "apply": { "model": "block/decorated_pot_north_sheaf" }, "when": { "north": "sheaf" } },
			{ "apply": { "model": "block/decorated_pot_north_shelter" }, "when": { "north": "shelter" } },
			{ "apply": { "model": "block/decorated_pot_north_skull" }, "when": { "north": "skull" } },
			{ "apply": { "model": "block/decorated_pot_north_snort" }, "when": { "north": "snort" } },

			{ "apply": { "model": "block/decorated_pot_east_angler" }, "when": { "east": "angler" } },
			{ "apply": { "model": "block/decorated_pot_east_archer" }, "when": { "east": "archer" } },
			{ "apply": { "model": "block/decorated_pot_east_arms_up" }, "when": { "east": "arms_up" } },
			{ "apply": { "model": "block/decorated_pot_east_blade" }, "when": { "east": "blade" } },
			{ "apply": { "model": "block/decorated_pot_east_brewer" }, "when": { "east": "brewer" } },
			{ "apply": { "model": "block/decorated_pot_east_burn" }, "when": { "east": "burn" } },
			{ "apply": { "model": "block/decorated_pot_east_danger" }, "when": { "east": "danger" } },
			{ "apply": { "model": "block/decorated_pot_east_explorer" }, "when": { "east": "explorer" } },
			{ "apply": { "model": "block/decorated_pot_east_flow" }, "when": { "east": "flow" } },
			{ "apply": { "model": "block/decorated_pot_east_friend" }, "when": { "east": "friend" } },
			{ "apply": { "model": "block/decorated_pot_east_guster" }, "when": { "east": "guster" } },
			{ "apply": { "model": "block/decorated_pot_east_heartbreak" }, "when": { "east": "heartbreak" } },
			{ "apply": { "model": "block/decorated_pot_east_heart" }, "when": { "east": "heart" } },
			{ "apply": { "model": "block/decorated_pot_east_howl" }, "when": { "east": "howl" } },
			{ "apply": { "model": "block/decorated_pot_east_miner" }, "when": { "east": "miner" } },
			{ "apply": { "model": "block/decorated_pot_east_mourner" }, "when": { "east": "mourner" } },
			{ "apply": { "model": "block/decorated_pot_east_plenty" }, "when": { "east": "plenty" } },
			{ "apply": { "model": "block/decorated_pot_east_prize" }, "when": { "east": "prize" } },
			{ "apply": { "model": "block/decorated_pot_east_scrape" }, "when": { "east": "scrape" } },
			{ "apply": { "model": "block/decorated_pot_east_sheaf" }, "when": { "east": "sheaf" } },
			{ "apply": { "model": "block/decorated_pot_east_shelter" }, "when": { "east": "shelter" } },
			{ "apply": { "model": "block/decorated_pot_east_skull" }, "when": { "east": "skull" } },
			{ "apply": { "model": "block/decorated_pot_east_snort" }, "when": { "east": "snort" } },

			{ "apply": { "model": "block/decorated_pot_south_angler" }, "when": { "south": "angler" } },
			{ "apply": { "model": "block/decorated_pot_south_archer" }, "when": { "south": "archer" } },
			{ "apply": { "model": "block/decorated_pot_south_arms_up" }, "when": { "south": "arms_up" } },
			{ "apply": { "model": "block/decorated_pot_south_blade" }, "when": { "south": "blade" } },
			{ "apply": { "model": "block/decorated_pot_south_brewer" }, "when": { "south": "brewer" } },
			{ "apply": { "model": "block/decorated_pot_south_burn" }, "when": { "south": "burn" } },
			{ "apply": { "model": "block/decorated_pot_south_danger" }, "when": { "south": "danger" } },
			{ "apply": { "model": "block/decorated_pot_south_explorer" }, "when": { "south": "explorer" } },
			{ "apply": { "model": "block/decorated_pot_south_flow" }, "when": { "south": "flow" } },
			{ "apply": { "model": "block/decorated_pot_south_friend" }, "when": { "south": "friend" } },
			{ "apply": { "model": "block/decorated_pot_south_guster" }, "when": { "south": "guster" } },
			{ "apply": { "model": "block/decorated_pot_south_heartbreak" }, "when": { "south": "heartbreak" } },
			{ "apply": { "model": "block/decorated_pot_south_heart" }, "when": { "south": "heart" } },
			{ "apply": { "model": "block/decorated_pot_south_howl" }, "when": { "south": "howl" } },
			{ "apply": { "model": "block/decorated_pot_south_miner" }, "when": { "south": "miner" } },
			{ "apply": { "model": "block/decorated_pot_south_mourner" }, "when": { "south": "mourner" } },
			{ "apply": { "model": "block/decorated_pot_south_plenty" }, "when": { "south": "plenty" } },
			{ "apply": { "model": "block/decorated_pot_south_prize" }, "when": { "south": "prize" } },
			{ "apply": { "model": "block/decorated_pot_south_scrape" }, "when": { "south": "scrape" } },
			{ "apply": { "model": "block/decorated_pot_south_sheaf" }, "when": { "south": "sheaf" } },
			{ "apply": { "model": "block/decorated_pot_south_shelter" }, "when": { "south": "shelter" } },
			{ "apply": { "model": "block/decorated_pot_south_skull" }, "when": { "south": "skull" } },
			{ "apply": { "model": "block/decorated_pot_south_snort" }, "when": { "south": "snort" } },

			{ "apply": { "model": "block/decorated_pot_west_angler" }, "when": { "west": "angler" } },
			{ "apply": { "model": "block/decorated_pot_west_archer" }, "when": { "west": "archer" } },
			{ "apply": { "model": "block/decorated_pot_west_arms_up" }, "when": { "west": "arms_up" } },
			{ "apply": { "model": "block/decorated_pot_west_blade" }, "when": { "west": "blade" } },
			{ "apply": { "model": "block/decorated_pot_west_brewer" }, "when": { "west": "brewer" } },
			{ "apply": { "model": "block/decorated_pot_west_burn" }, "when": { "west": "burn" } },
			{ "apply": { "model": "block/decorated_pot_west_danger" }, "when": { "west": "danger" } },
			{ "apply": { "model": "block/decorated_pot_west_explorer" }, "when": { "west": "explorer" } },
			{ "apply": { "model": "block/decorated_pot_west_flow" }, "when": { "west": "flow" } },
			{ "apply": { "model": "block/decorated_pot_west_friend" }, "when": { "west": "friend" } },
			{ "apply": { "model": "block/decorated_pot_west_guster" }, "when": { "west": "guster" } },
			{ "apply": { "model": "block/decorated_pot_west_heartbreak" }, "when": { "west": "heartbreak" } },
			{ "apply": { "model": "block/decorated_pot_west_heart" }, "when": { "west": "heart" } },
			{ "apply": { "model": "block/decorated_pot_west_howl" }, "when": { "west": "howl" } },
			{ "apply": { "model": "block/decorated_pot_west_miner" }, "when": { "west": "miner" } },
			{ "apply": { "model": "block/decorated_pot_west_mourner" }, "when": { "west": "mourner" } },
			{ "apply": { "model": "block/decorated_pot_west_plenty" }, "when": { "west": "plenty" } },
			{ "apply": { "model": "block/decorated_pot_west_prize" }, "when": { "west": "prize" } },
			{ "apply": { "model": "block/decorated_pot_west_scrape" }, "when": { "west": "scrape" } },
			{ "apply": { "model": "block/decorated_pot_west_sheaf" }, "when": { "west": "sheaf" } },
			{ "apply": { "model": "block/decorated_pot_west_shelter" }, "when": { "west": "shelter" } },
			{ "apply": { "model": "block/decorated_pot_west_skull" }, "when": { "west": "skull" } },
			{ "apply": { "model": "block/decorated_pot_west_snort" }, "when": { "west": "snort" } },
		]
	},
	// decorated pot
	"assets/minecraft/models/block/decorated_pot.json": {
		"textures": {
			"particle": "entity/decorated_pot/decorated_pot_base",
			"base": "entity/decorated_pot/decorated_pot_base"
		},
		"elements": [
			{
				"from": [1, 0, 1],
				"to": [15, 16, 15],
				"faces": {
					"up": { "uv": [7, 13.5, 14, 6.5], "texture": "#base" },
					"down": { "uv": [0, 6.5, 7, 13.5], "texture": "#base" }
				}
			},
			{
				"from": [4.8, 15.855, 4.8],
				"to": [11.2, 17.089, 11.2],
				"faces": {
					"north": { "uv": [6, 5.5, 9, 6], "texture": "#base" },
					"east": { "uv": [3, 5.5, 6, 6], "texture": "#base" },
					"south": { "uv": [0, 5.5, 3, 6], "texture": "#base" },
					"west": { "uv": [9, 5.5, 12, 6], "texture": "#base" }
				}
			},
			{
				"from": [4.098, 17, 4.098],
				"to": [11.902, 20, 11.902],
				"faces": {
					"north": { "uv": [8, 4, 12, 5.5], "texture": "#base" },
					"east": { "uv": [4, 4, 8, 5.5], "texture": "#base" },
					"south": { "uv": [0, 4, 4, 5.5], "texture": "#base" },
					"west": { "uv": [12, 4, 16, 5.5], "texture": "#base" },
					"up": { "uv": [4, 0, 8, 4], "texture": "#base" },
					"down": { "uv": [8, 4, 12, 0], "texture": "#base" }
				}
			}
		]
	},
	"assets/minecraft/models/block/decorated_pot_north.json": {
		"textures": { "1": "entity/decorated_pot/decorated_pot_side" },
		"elements": [{ "from": [1, 0, 1], "to": [15, 16, 15], "faces": { "north": { "uv": [1, 0, 15, 16], "texture": "#1" } } }]
	},
	"assets/minecraft/models/block/decorated_pot_north_angler.json": { "textures": { "1": "entity/decorated_pot/angler_pottery_pattern" }, "parent": "block/decorated_pot_north" },
	"assets/minecraft/models/block/decorated_pot_north_archer.json": { "textures": { "1": "entity/decorated_pot/archer_pottery_pattern" }, "parent": "block/decorated_pot_north" },
	"assets/minecraft/models/block/decorated_pot_north_arms_up.json": { "textures": { "1": "entity/decorated_pot/arms_up_pottery_pattern" }, "parent": "block/decorated_pot_north" },
	"assets/minecraft/models/block/decorated_pot_north_blade.json": { "textures": { "1": "entity/decorated_pot/blade_pottery_pattern" }, "parent": "block/decorated_pot_north" },
	"assets/minecraft/models/block/decorated_pot_north_brewer.json": { "textures": { "1": "entity/decorated_pot/brewer_pottery_pattern" }, "parent": "block/decorated_pot_north" },
	"assets/minecraft/models/block/decorated_pot_north_burn.json": { "textures": { "1": "entity/decorated_pot/burn_pottery_pattern" }, "parent": "block/decorated_pot_north" },
	"assets/minecraft/models/block/decorated_pot_north_danger.json": { "textures": { "1": "entity/decorated_pot/danger_pottery_pattern" }, "parent": "block/decorated_pot_north" },
	"assets/minecraft/models/block/decorated_pot_north_explorer.json": { "textures": { "1": "entity/decorated_pot/explorer_pottery_pattern" }, "parent": "block/decorated_pot_north" },
	"assets/minecraft/models/block/decorated_pot_north_flow.json": { "textures": { "1": "entity/decorated_pot/flow_pottery_pattern" }, "parent": "block/decorated_pot_north" },
	"assets/minecraft/models/block/decorated_pot_north_friend.json": { "textures": { "1": "entity/decorated_pot/friend_pottery_pattern" }, "parent": "block/decorated_pot_north" },
	"assets/minecraft/models/block/decorated_pot_north_guster.json": { "textures": { "1": "entity/decorated_pot/guster_pottery_pattern" }, "parent": "block/decorated_pot_north" },
	"assets/minecraft/models/block/decorated_pot_north_heartbreak.json": { "textures": { "1": "entity/decorated_pot/heartbreak_pottery_pattern" }, "parent": "block/decorated_pot_north" },
	"assets/minecraft/models/block/decorated_pot_north_heart.json": { "textures": { "1": "entity/decorated_pot/heart_pottery_pattern" }, "parent": "block/decorated_pot_north" },
	"assets/minecraft/models/block/decorated_pot_north_howl.json": { "textures": { "1": "entity/decorated_pot/howl_pottery_pattern" }, "parent": "block/decorated_pot_north" },
	"assets/minecraft/models/block/decorated_pot_north_miner.json": { "textures": { "1": "entity/decorated_pot/miner_pottery_pattern" }, "parent": "block/decorated_pot_north" },
	"assets/minecraft/models/block/decorated_pot_north_mourner.json": { "textures": { "1": "entity/decorated_pot/mourner_pottery_pattern" }, "parent": "block/decorated_pot_north" },
	"assets/minecraft/models/block/decorated_pot_north_plenty.json": { "textures": { "1": "entity/decorated_pot/plenty_pottery_pattern" }, "parent": "block/decorated_pot_north" },
	"assets/minecraft/models/block/decorated_pot_north_prize.json": { "textures": { "1": "entity/decorated_pot/prize_pottery_pattern" }, "parent": "block/decorated_pot_north" },
	"assets/minecraft/models/block/decorated_pot_north_scrape.json": { "textures": { "1": "entity/decorated_pot/scrape_pottery_pattern" }, "parent": "block/decorated_pot_north" },
	"assets/minecraft/models/block/decorated_pot_north_sheaf.json": { "textures": { "1": "entity/decorated_pot/sheaf_pottery_pattern" }, "parent": "block/decorated_pot_north" },
	"assets/minecraft/models/block/decorated_pot_north_shelter.json": { "textures": { "1": "entity/decorated_pot/shelter_pottery_pattern" }, "parent": "block/decorated_pot_north" },
	"assets/minecraft/models/block/decorated_pot_north_skull.json": { "textures": { "1": "entity/decorated_pot/skull_pottery_pattern" }, "parent": "block/decorated_pot_north" },
	"assets/minecraft/models/block/decorated_pot_north_snort.json": { "textures": { "1": "entity/decorated_pot/snort_pottery_pattern" }, "parent": "block/decorated_pot_north" },

	"assets/minecraft/models/block/decorated_pot_east.json": {
		"textures": { "1": "entity/decorated_pot/decorated_pot_side" },
		"elements": [{ "from": [1, 0, 1], "to": [15, 16, 15], "faces": { "east": { "uv": [1, 0, 15, 16], "texture": "#1" } } }]
	},
	"assets/minecraft/models/block/decorated_pot_east_angler.json": { "textures": { "1": "entity/decorated_pot/angler_pottery_pattern" }, "parent": "block/decorated_pot_east" },
	"assets/minecraft/models/block/decorated_pot_east_archer.json": { "textures": { "1": "entity/decorated_pot/archer_pottery_pattern" }, "parent": "block/decorated_pot_east" },
	"assets/minecraft/models/block/decorated_pot_east_arms_up.json": { "textures": { "1": "entity/decorated_pot/arms_up_pottery_pattern" }, "parent": "block/decorated_pot_east" },
	"assets/minecraft/models/block/decorated_pot_east_blade.json": { "textures": { "1": "entity/decorated_pot/blade_pottery_pattern" }, "parent": "block/decorated_pot_east" },
	"assets/minecraft/models/block/decorated_pot_east_brewer.json": { "textures": { "1": "entity/decorated_pot/brewer_pottery_pattern" }, "parent": "block/decorated_pot_east" },
	"assets/minecraft/models/block/decorated_pot_east_burn.json": { "textures": { "1": "entity/decorated_pot/burn_pottery_pattern" }, "parent": "block/decorated_pot_east" },
	"assets/minecraft/models/block/decorated_pot_east_danger.json": { "textures": { "1": "entity/decorated_pot/danger_pottery_pattern" }, "parent": "block/decorated_pot_east" },
	"assets/minecraft/models/block/decorated_pot_east_explorer.json": { "textures": { "1": "entity/decorated_pot/explorer_pottery_pattern" }, "parent": "block/decorated_pot_east" },
	"assets/minecraft/models/block/decorated_pot_east_flow.json": { "textures": { "1": "entity/decorated_pot/flow_pottery_pattern" }, "parent": "block/decorated_pot_east" },
	"assets/minecraft/models/block/decorated_pot_east_friend.json": { "textures": { "1": "entity/decorated_pot/friend_pottery_pattern" }, "parent": "block/decorated_pot_east" },
	"assets/minecraft/models/block/decorated_pot_east_guster.json": { "textures": { "1": "entity/decorated_pot/guster_pottery_pattern" }, "parent": "block/decorated_pot_east" },
	"assets/minecraft/models/block/decorated_pot_east_heartbreak.json": { "textures": { "1": "entity/decorated_pot/heartbreak_pottery_pattern" }, "parent": "block/decorated_pot_east" },
	"assets/minecraft/models/block/decorated_pot_east_heart.json": { "textures": { "1": "entity/decorated_pot/heart_pottery_pattern" }, "parent": "block/decorated_pot_east" },
	"assets/minecraft/models/block/decorated_pot_east_howl.json": { "textures": { "1": "entity/decorated_pot/howl_pottery_pattern" }, "parent": "block/decorated_pot_east" },
	"assets/minecraft/models/block/decorated_pot_east_miner.json": { "textures": { "1": "entity/decorated_pot/miner_pottery_pattern" }, "parent": "block/decorated_pot_east" },
	"assets/minecraft/models/block/decorated_pot_east_mourner.json": { "textures": { "1": "entity/decorated_pot/mourner_pottery_pattern" }, "parent": "block/decorated_pot_east" },
	"assets/minecraft/models/block/decorated_pot_east_plenty.json": { "textures": { "1": "entity/decorated_pot/plenty_pottery_pattern" }, "parent": "block/decorated_pot_east" },
	"assets/minecraft/models/block/decorated_pot_east_prize.json": { "textures": { "1": "entity/decorated_pot/prize_pottery_pattern" }, "parent": "block/decorated_pot_east" },
	"assets/minecraft/models/block/decorated_pot_east_scrape.json": { "textures": { "1": "entity/decorated_pot/scrape_pottery_pattern" }, "parent": "block/decorated_pot_east" },
	"assets/minecraft/models/block/decorated_pot_east_sheaf.json": { "textures": { "1": "entity/decorated_pot/sheaf_pottery_pattern" }, "parent": "block/decorated_pot_east" },
	"assets/minecraft/models/block/decorated_pot_east_shelter.json": { "textures": { "1": "entity/decorated_pot/shelter_pottery_pattern" }, "parent": "block/decorated_pot_east" },
	"assets/minecraft/models/block/decorated_pot_east_skull.json": { "textures": { "1": "entity/decorated_pot/skull_pottery_pattern" }, "parent": "block/decorated_pot_east" },
	"assets/minecraft/models/block/decorated_pot_east_snort.json": { "textures": { "1": "entity/decorated_pot/snort_pottery_pattern" }, "parent": "block/decorated_pot_east" },
	"assets/minecraft/models/block/decorated_pot_south.json": {
		"textures": { "1": "entity/decorated_pot/decorated_pot_side", },
		"elements": [{ "from": [1, 0, 1], "to": [15, 16, 15], "faces": { "south": { "uv": [1, 0, 15, 16], "texture": "#1" } } }]
	},
	"assets/minecraft/models/block/decorated_pot_south_angler.json": { "textures": { "1": "entity/decorated_pot/angler_pottery_pattern" }, "parent": "block/decorated_pot_south" },
	"assets/minecraft/models/block/decorated_pot_south_archer.json": { "textures": { "1": "entity/decorated_pot/archer_pottery_pattern" }, "parent": "block/decorated_pot_south" },
	"assets/minecraft/models/block/decorated_pot_south_arms_up.json": { "textures": { "1": "entity/decorated_pot/arms_up_pottery_pattern" }, "parent": "block/decorated_pot_south" },
	"assets/minecraft/models/block/decorated_pot_south_blade.json": { "textures": { "1": "entity/decorated_pot/blade_pottery_pattern" }, "parent": "block/decorated_pot_south" },
	"assets/minecraft/models/block/decorated_pot_south_brewer.json": { "textures": { "1": "entity/decorated_pot/brewer_pottery_pattern" }, "parent": "block/decorated_pot_south" },
	"assets/minecraft/models/block/decorated_pot_south_burn.json": { "textures": { "1": "entity/decorated_pot/burn_pottery_pattern" }, "parent": "block/decorated_pot_south" },
	"assets/minecraft/models/block/decorated_pot_south_danger.json": { "textures": { "1": "entity/decorated_pot/danger_pottery_pattern" }, "parent": "block/decorated_pot_south" },
	"assets/minecraft/models/block/decorated_pot_south_explorer.json": { "textures": { "1": "entity/decorated_pot/explorer_pottery_pattern" }, "parent": "block/decorated_pot_south" },
	"assets/minecraft/models/block/decorated_pot_south_flow.json": { "textures": { "1": "entity/decorated_pot/flow_pottery_pattern" }, "parent": "block/decorated_pot_south" },
	"assets/minecraft/models/block/decorated_pot_south_friend.json": { "textures": { "1": "entity/decorated_pot/friend_pottery_pattern" }, "parent": "block/decorated_pot_south" },
	"assets/minecraft/models/block/decorated_pot_south_guster.json": { "textures": { "1": "entity/decorated_pot/guster_pottery_pattern" }, "parent": "block/decorated_pot_south" },
	"assets/minecraft/models/block/decorated_pot_south_heartbreak.json": { "textures": { "1": "entity/decorated_pot/heartbreak_pottery_pattern" }, "parent": "block/decorated_pot_south" },
	"assets/minecraft/models/block/decorated_pot_south_heart.json": { "textures": { "1": "entity/decorated_pot/heart_pottery_pattern" }, "parent": "block/decorated_pot_south" },
	"assets/minecraft/models/block/decorated_pot_south_howl.json": { "textures": { "1": "entity/decorated_pot/howl_pottery_pattern" }, "parent": "block/decorated_pot_south" },
	"assets/minecraft/models/block/decorated_pot_south_miner.json": { "textures": { "1": "entity/decorated_pot/miner_pottery_pattern" }, "parent": "block/decorated_pot_south" },
	"assets/minecraft/models/block/decorated_pot_south_mourner.json": { "textures": { "1": "entity/decorated_pot/mourner_pottery_pattern" }, "parent": "block/decorated_pot_south" },
	"assets/minecraft/models/block/decorated_pot_south_plenty.json": { "textures": { "1": "entity/decorated_pot/plenty_pottery_pattern" }, "parent": "block/decorated_pot_south" },
	"assets/minecraft/models/block/decorated_pot_south_prize.json": { "textures": { "1": "entity/decorated_pot/prize_pottery_pattern" }, "parent": "block/decorated_pot_south" },
	"assets/minecraft/models/block/decorated_pot_south_scrape.json": { "textures": { "1": "entity/decorated_pot/scrape_pottery_pattern" }, "parent": "block/decorated_pot_south" },
	"assets/minecraft/models/block/decorated_pot_south_sheaf.json": { "textures": { "1": "entity/decorated_pot/sheaf_pottery_pattern" }, "parent": "block/decorated_pot_south" },
	"assets/minecraft/models/block/decorated_pot_south_shelter.json": { "textures": { "1": "entity/decorated_pot/shelter_pottery_pattern" }, "parent": "block/decorated_pot_south" },
	"assets/minecraft/models/block/decorated_pot_south_skull.json": { "textures": { "1": "entity/decorated_pot/skull_pottery_pattern" }, "parent": "block/decorated_pot_south" },
	"assets/minecraft/models/block/decorated_pot_south_snort.json": { "textures": { "1": "entity/decorated_pot/snort_pottery_pattern" }, "parent": "block/decorated_pot_south" },
	"assets/minecraft/models/block/decorated_pot_west.json": {
		"textures": { "1": "entity/decorated_pot/decorated_pot_side" },
		"elements": [{ "from": [1, 0, 1], "to": [15, 16, 15], "faces": { "west": { "uv": [1, 0, 15, 16], "texture": "#1" } } }]
	},
	"assets/minecraft/models/block/decorated_pot_west_angler.json": { "textures": { "1": "entity/decorated_pot/angler_pottery_pattern" }, "parent": "block/decorated_pot_west" },
	"assets/minecraft/models/block/decorated_pot_west_archer.json": { "textures": { "1": "entity/decorated_pot/archer_pottery_pattern" }, "parent": "block/decorated_pot_west" },
	"assets/minecraft/models/block/decorated_pot_west_arms_up.json": { "textures": { "1": "entity/decorated_pot/arms_up_pottery_pattern" }, "parent": "block/decorated_pot_west" },
	"assets/minecraft/models/block/decorated_pot_west_blade.json": { "textures": { "1": "entity/decorated_pot/blade_pottery_pattern" }, "parent": "block/decorated_pot_west" },
	"assets/minecraft/models/block/decorated_pot_west_brewer.json": { "textures": { "1": "entity/decorated_pot/brewer_pottery_pattern" }, "parent": "block/decorated_pot_west" },
	"assets/minecraft/models/block/decorated_pot_west_burn.json": { "textures": { "1": "entity/decorated_pot/burn_pottery_pattern" }, "parent": "block/decorated_pot_west" },
	"assets/minecraft/models/block/decorated_pot_west_danger.json": { "textures": { "1": "entity/decorated_pot/danger_pottery_pattern" }, "parent": "block/decorated_pot_west" },
	"assets/minecraft/models/block/decorated_pot_west_explorer.json": { "textures": { "1": "entity/decorated_pot/explorer_pottery_pattern" }, "parent": "block/decorated_pot_west" },
	"assets/minecraft/models/block/decorated_pot_west_flow.json": { "textures": { "1": "entity/decorated_pot/flow_pottery_pattern" }, "parent": "block/decorated_pot_west" },
	"assets/minecraft/models/block/decorated_pot_west_friend.json": { "textures": { "1": "entity/decorated_pot/friend_pottery_pattern" }, "parent": "block/decorated_pot_west" },
	"assets/minecraft/models/block/decorated_pot_west_guster.json": { "textures": { "1": "entity/decorated_pot/guster_pottery_pattern" }, "parent": "block/decorated_pot_west" },
	"assets/minecraft/models/block/decorated_pot_west_heartbreak.json": { "textures": { "1": "entity/decorated_pot/heartbreak_pottery_pattern" }, "parent": "block/decorated_pot_west" },
	"assets/minecraft/models/block/decorated_pot_west_heart.json": { "textures": { "1": "entity/decorated_pot/heart_pottery_pattern" }, "parent": "block/decorated_pot_west" },
	"assets/minecraft/models/block/decorated_pot_west_howl.json": { "textures": { "1": "entity/decorated_pot/howl_pottery_pattern" }, "parent": "block/decorated_pot_west" },
	"assets/minecraft/models/block/decorated_pot_west_miner.json": { "textures": { "1": "entity/decorated_pot/miner_pottery_pattern" }, "parent": "block/decorated_pot_west" },
	"assets/minecraft/models/block/decorated_pot_west_mourner.json": { "textures": { "1": "entity/decorated_pot/mourner_pottery_pattern" }, "parent": "block/decorated_pot_west" },
	"assets/minecraft/models/block/decorated_pot_west_plenty.json": { "textures": { "1": "entity/decorated_pot/plenty_pottery_pattern" }, "parent": "block/decorated_pot_west" },
	"assets/minecraft/models/block/decorated_pot_west_prize.json": { "textures": { "1": "entity/decorated_pot/prize_pottery_pattern" }, "parent": "block/decorated_pot_west" },
	"assets/minecraft/models/block/decorated_pot_west_scrape.json": { "textures": { "1": "entity/decorated_pot/scrape_pottery_pattern" }, "parent": "block/decorated_pot_west" },
	"assets/minecraft/models/block/decorated_pot_west_sheaf.json": { "textures": { "1": "entity/decorated_pot/sheaf_pottery_pattern" }, "parent": "block/decorated_pot_west" },
	"assets/minecraft/models/block/decorated_pot_west_shelter.json": { "textures": { "1": "entity/decorated_pot/shelter_pottery_pattern" }, "parent": "block/decorated_pot_west" },
	"assets/minecraft/models/block/decorated_pot_west_skull.json": { "textures": { "1": "entity/decorated_pot/skull_pottery_pattern" }, "parent": "block/decorated_pot_west" },
	"assets/minecraft/models/block/decorated_pot_west_snort.json": { "textures": { "1": "entity/decorated_pot/snort_pottery_pattern" }, "parent": "block/decorated_pot_west" },
	// conduit
	"assets/minecraft/models/block/conduit.json": {
		"textures": {
			"base": "entity/conduit/base"
		},
		"elements": [
			{
				"from": [5, 5, 5],
				"to": [11, 11, 11],
				"faces": {
					"north": { "uv": [3, 6, 6, 12], "texture": "#base" },
					"east": { "uv": [0, 6, 3, 12], "texture": "#base" },
					"south": { "uv": [9, 6, 12, 12], "texture": "#base" },
					"west": { "uv": [6, 6, 9, 12], "texture": "#base" },
					"up": { "uv": [6, 6, 3, 0], "texture": "#base" },
					"down": { "uv": [9, 0, 6, 6], "texture": "#base" }
				}
			}
		]
	},
	// creeper head
	"assets/minecraft/blockstates/creeper_head.json": {
		"variants": {
			"facing=north": { "model": "block/creeper_head" },
			"facing=east": { "model": "block/creeper_head", "y": 90 },
			"facing=south": { "model": "block/creeper_head", "y": 180 },
			"facing=west": { "model": "block/creeper_head", "y": 270 }
		}
	},
	"assets/minecraft/models/block/creeper_head.json": {
		"textures": {
			"head": "entity/creeper/creeper"
		},
		"elements": [
			{
				"from": [4, 0, 4],
				"to": [12, 8, 12],
				"faces": {
					"north": { "uv": [4, 4, 2, 8], "texture": "#head" },
					"east": { "uv": [6, 4, 4, 8], "texture": "#head" },
					"south": { "uv": [8, 4, 6, 8], "texture": "#head" },
					"west": { "uv": [2, 4, 0, 8], "texture": "#head" },
					"up": { "uv": [2, 4, 4, 0], "texture": "#head" },
					"down": { "uv": [4, 0, 6, 4], "texture": "#head" }
				}
			}
		]
	},
	"assets/minecraft/blockstates/creeper_wall_head.json": {
		"variants": {
			"facing=north": { "model": "block/creeper_wall_head", "y": 180 },
			"facing=east": { "model": "block/creeper_wall_head", "y": 270 },
			"facing=south": { "model": "block/creeper_wall_head" },
			"facing=west": { "model": "block/creeper_wall_head", "y": 90 }
		}
	},
	"assets/minecraft/models/block/creeper_wall_head.json": {
		"textures": {
			"head": "entity/creeper/creeper",
			"particle": "entity/creeper/creeper"
		},
		"elements": [
			{
				"from": [4, 4, 8],
				"to": [12, 12, 16],
				"faces": {
					"north": { "uv": [4, 4, 2, 8], "texture": "#head" },
					"east": { "uv": [6, 4, 4, 8], "texture": "#head" },
					"south": { "uv": [8, 4, 6, 8], "texture": "#head" },
					"west": { "uv": [2, 4, 0, 8], "texture": "#head" },
					"up": { "uv": [2, 4, 4, 0], "texture": "#head" },
					"down": { "uv": [4, 0, 6, 4], "texture": "#head" }
				}
			}
		]
	},
	// skeleton skull
	"assets/minecraft/blockstates/skeleton_skull.json": {
		"variants": {
			"facing=north": { "model": "block/skeleton_skull" },
			"facing=east": { "model": "block/skeleton_skull", "y": 90 },
			"facing=south": { "model": "block/skeleton_skull", "y": 180 },
			"facing=west": { "model": "block/skeleton_skull", "y": 270 }
		}
	},
	"assets/minecraft/models/block/skeleton_skull.json": {
		"textures": {
			"head": "entity/skeleton/skeleton"
		},
		"elements": [
			{
				"from": [4, 0, 4],
				"to": [12, 8, 12],
				"faces": {
					"north": { "uv": [2, 4, 4, 8], "texture": "#head" },
					"east": { "uv": [0, 4, 2, 8], "texture": "#head" },
					"south": { "uv": [6, 4, 8, 8], "texture": "#head" },
					"west": { "uv": [4, 4, 6, 8], "texture": "#head" },
					"up": { "uv": [4, 4, 2, 0], "texture": "#head" },
					"down": { "uv": [6, 0, 4, 4], "texture": "#head" }
				}
			}
		]
	},
	"assets/minecraft/blockstates/skeleton_wall_skull.json": {
		"variants": {
			"facing=north": { "model": "block/skeleton_wall_skull", "y": 180 },
			"facing=east": { "model": "block/skeleton_wall_skull", "y": 270 },
			"facing=south": { "model": "block/skeleton_wall_skull" },
			"facing=west": { "model": "block/skeleton_wall_skull", "y": 90 }
		}
	},
	"assets/minecraft/models/block/skeleton_wall_skull.json": {
		"textures": {
			"head": "entity/skeleton/skeleton"
		},
		"elements": [
			{
				"from": [4, 4, 8],
				"to": [12, 12, 16],
				"faces": {
					"north": { "uv": [2, 4, 4, 8], "texture": "#head" },
					"east": { "uv": [0, 4, 2, 8], "texture": "#head" },
					"south": { "uv": [6, 4, 8, 8], "texture": "#head" },
					"west": { "uv": [4, 4, 6, 8], "texture": "#head" },
					"up": { "uv": [4, 4, 2, 0], "texture": "#head" },
					"down": { "uv": [6, 0, 4, 4], "texture": "#head" }
				}
			}
		]
	},
	// wither skeleton skull
	"assets/minecraft/blockstates/wither_skeleton_skull.json": {
		"variants": {
			"facing=north": { "model": "block/wither_skeleton_skull" },
			"facing=east": { "model": "block/wither_skeleton_skull", "y": 90 },
			"facing=south": { "model": "block/wither_skeleton_skull", "y": 180 },
			"facing=west": { "model": "block/wither_skeleton_skull", "y": 270 }
		}
	},
	"assets/minecraft/models/block/wither_skeleton_skull.json": {
		"textures": {
			"head": "entity/skeleton/wither_skeleton"
		},
		"parent": "block/skeleton_skull"
	},
	"assets/minecraft/blockstates/wither_skeleton_wall_skull.json": {
		"variants": {
			"facing=north": { "model": "block/wither_skeleton_wall_skull", "y": 180 },
			"facing=east": { "model": "block/wither_skeleton_wall_skull", "y": 270 },
			"facing=south": { "model": "block/wither_skeleton_wall_skull" },
			"facing=west": { "model": "block/wither_skeleton_wall_skull", "y": 90 }
		}
	},
	"assets/minecraft/models/block/wither_skeleton_wall_skull.json": {
		"textures": {
			"head": "entity/skeleton/wither_skeleton"
		},
		"parent": "block/skeleton_wall_skull"
	},
	// player head
	"assets/minecraft/blockstates/player_head.json": {
		"variants": {
			"facing=north": { "model": "block/player_head" },
			"facing=east": { "model": "block/player_head", "y": 90 },
			"facing=south": { "model": "block/player_head", "y": 180 },
			"facing=west": { "model": "block/player_head", "y": 270 }
		}
	},
	"assets/minecraft/models/block/player_head.json": {
		"textures": {
			"head": "entity/player/wide/steve"
		},
		"elements": [
			{
				"from": [4, 0, 4],
				"to": [12, 8, 12],
				"faces": {
					"north": { "uv": [4, 2, 2, 4], "texture": "#head" },
					"east": { "uv": [6, 2, 4, 4], "texture": "#head" },
					"south": { "uv": [8, 2, 6, 4], "texture": "#head" },
					"west": { "uv": [2, 2, 0, 4], "texture": "#head" },
					"up": { "uv": [2, 2, 4, 0], "texture": "#head" },
					"down": { "uv": [4, 0, 6, 2], "texture": "#head" }
				}
			}
		]
	},
	"assets/minecraft/blockstates/player_wall_head.json": {
		"variants": {
			"facing=north": { "model": "block/player_wall_head", "y": 180 },
			"facing=east": { "model": "block/player_wall_head", "y": 270 },
			"facing=south": { "model": "block/player_wall_head" },
			"facing=west": { "model": "block/player_wall_head", "y": 90 }
		}
	},
	"assets/minecraft/models/block/player_wall_head.json": {
		"textures": {
			"head": "entity/player/wide/steve"
		},
		"elements": [
			{
				"from": [4, 4, 8],
				"to": [12, 12, 16],
				"faces": {
					"north": { "uv": [4, 2, 2, 4], "texture": "#head" },
					"east": { "uv": [6, 2, 4, 4], "texture": "#head" },
					"south": { "uv": [8, 2, 6, 4], "texture": "#head" },
					"west": { "uv": [2, 2, 0, 4], "texture": "#head" },
					"up": { "uv": [2, 2, 4, 0], "texture": "#head" },
					"down": { "uv": [4, 0, 6, 2], "texture": "#head" }
				}
			}
		]
	},
	//zombie_head
	"assets/minecraft/blockstates/zombie_head.json": {
		"variants": {
			"facing=north": { "model": "block/zombie_head" },
			"facing=east": { "model": "block/zombie_head", "y": 90 },
			"facing=south": { "model": "block/zombie_head", "y": 180 },
			"facing=west": { "model": "block/zombie_head", "y": 270 }
		}
	},
	"assets/minecraft/models/block/zombie_head.json": {
		"textures": {
			"head": "entity/zombie/zombie"
		},
		"parent": "block/player_head"
	},
	"assets/minecraft/blockstates/zombie_wall_head.json": {
		"variants": {
			"facing=north": { "model": "block/zombie_wall_head", "y": 180 },
			"facing=east": { "model": "block/zombie_wall_head", "y": 270 },
			"facing=south": { "model": "block/zombie_wall_head" },
			"facing=west": { "model": "block/zombie_wall_head", "y": 90 }
		}
	},
	"assets/minecraft/models/block/zombie_wall_head.json": {
		"textures": {
			"head": "entity/zombie/zombie"
		},
		"parent": "block/player_wall_head"
	},
	// piglin head
	"assets/minecraft/blockstates/piglin_head.json": {
		"variants": {
			"facing=north": { "model": "block/piglin_head" },
			"facing=east": { "model": "block/piglin_head", "y": 90 },
			"facing=south": { "model": "block/piglin_head", "y": 180 },
			"facing=west": { "model": "block/piglin_head", "y": 270 }
		}
	},
	"assets/minecraft/models/block/piglin_head.json": {
		"textures": {
			"head": "entity/piglin/piglin"
		},
		"elements": [
			{
				"from": [3, 0, 4],
				"to": [13, 8, 12],
				"faces": {
					"north": { "uv": [2, 2, 4.5, 4], "texture": "#head" },
					"east": { "uv": [0, 2, 2, 4], "texture": "#head" },
					"south": { "uv": [6.5, 2, 9, 4], "texture": "#head" },
					"west": { "uv": [4.5, 2, 6.5, 4], "texture": "#head" },
					"up": { "uv": [4.5, 2, 2, 0], "texture": "#head" },
					"down": { "uv": [7, 0, 4.5, 2], "texture": "#head" }
				}
			},
			{
				"from": [6, 0, 3],
				"to": [10, 4, 4],
				"faces": {
					"north": { "uv": [8, 0.5, 9, 1.5], "texture": "#head" },
					"east": { "uv": [7.75, 0.5, 8, 1.5], "texture": "#head" },
					"south": { "uv": [9.25, 0.5, 10.25, 1.5], "texture": "#head" },
					"west": { "uv": [9, 0.5, 9.25, 1.5], "texture": "#head" },
					"up": { "uv": [9, 0.5, 8, 0.25], "texture": "#head" },
					"down": { "uv": [10, 0.25, 9, 0.5], "texture": "#head" }
				}
			},
			{
				"from": [10, 0, 3],
				"to": [11, 2, 4],
				"faces": {
					"north": { "uv": [0.75, 0.25, 1, 0.75], "texture": "#head" },
					"east": { "uv": [0.5, 0.25, 0.75, 0.75], "texture": "#head" },
					"south": { "uv": [1.25, 0.25, 1.5, 0.75], "texture": "#head" },
					"west": { "uv": [1, 0.25, 1.25, 0.75], "texture": "#head" },
					"up": { "uv": [1, 0.25, 0.75, 0], "texture": "#head" },
					"down": { "uv": [1.25, 0, 1, 0.25], "texture": "#head" }
				}
			},
			{
				"from": [5, 0, 3],
				"to": [6, 2, 4],
				"faces": {
					"north": { "uv": [0.75, 1.25, 1, 1.75], "texture": "#head" },
					"east": { "uv": [0.5, 1.25, 0.75, 1.75], "texture": "#head" },
					"south": { "uv": [1.25, 1.25, 1.5, 1.75], "texture": "#head" },
					"west": { "uv": [1, 1.25, 1.25, 1.75], "texture": "#head" },
					"up": { "uv": [1, 1.25, 0.75, 1], "texture": "#head" },
					"down": { "uv": [1.25, 1, 1, 1.25], "texture": "#head" }
				}
			},
			{
				"name": "earRight",
				"from": [12, 1, 6],
				"to": [13, 6, 10],
				"rotation": { "angle": 22.5, "axis": "z", "origin": [12, 6, 8] },
				"faces": {
					"north": { "uv": [10.75, 2.5, 11, 3.75], "texture": "#head" },
					"east": { "uv": [9.75, 2.5, 10.75, 3.75], "texture": "#head" },
					"south": { "uv": [12, 2.5, 12.25, 3.75], "texture": "#head" },
					"west": { "uv": [11, 2.5, 12, 3.75], "texture": "#head" },
					"up": { "uv": [11, 2.5, 10.75, 1.5], "texture": "#head" },
					"down": { "uv": [11.25, 1.5, 11, 2.5], "texture": "#head" }
				}
			},
			{
				"name": "earLeft",
				"from": [3, 1, 6],
				"to": [4, 6, 10],
				"rotation": { "angle": -22.5, "axis": "z", "origin": [4, 6, 8] },
				"faces": {
					"north": { "uv": [13.75, 2.5, 14, 3.75], "texture": "#head" },
					"east": { "uv": [12.75, 2.5, 13.75, 3.75], "texture": "#head" },
					"south": { "uv": [15, 2.5, 15.25, 3.75], "texture": "#head" },
					"west": { "uv": [14, 2.5, 15, 3.75], "texture": "#head" },
					"up": { "uv": [14, 2.5, 13.75, 1.5], "texture": "#head" },
					"down": { "uv": [14.25, 1.5, 14, 2.5], "texture": "#head" }
				}
			}
		]
	},
	"assets/minecraft/blockstates/piglin_wall_head.json": {
		"variants": {
			"facing=north": { "model": "block/piglin_wall_head", "y": 180 },
			"facing=east": { "model": "block/piglin_wall_head", "y": 270 },
			"facing=south": { "model": "block/piglin_wall_head" },
			"facing=west": { "model": "block/piglin_wall_head", "y": 90 }
		}
	},
	"assets/minecraft/models/block/piglin_wall_head.json": {
		"textures": {
			"head": "entity/piglin/piglin"
		},
		"elements": [
			{
				"from": [3, 4, 8],
				"to": [13, 12, 16],
				"faces": {
					"north": { "uv": [2, 2, 4.5, 4], "texture": "#head" },
					"east": { "uv": [0, 2, 2, 4], "texture": "#head" },
					"south": { "uv": [6.5, 2, 9, 4], "texture": "#head" },
					"west": { "uv": [4.5, 2, 6.5, 4], "texture": "#head" },
					"up": { "uv": [4.5, 2, 2, 0], "texture": "#head" },
					"down": { "uv": [7, 0, 4.5, 2], "texture": "#head" }
				}
			},
			{
				"from": [6, 4, 7],
				"to": [10, 8, 8],
				"faces": {
					"north": { "uv": [8, 0.5, 9, 1.5], "texture": "#head" },
					"east": { "uv": [7.75, 0.5, 8, 1.5], "texture": "#head" },
					"south": { "uv": [9.25, 0.5, 10.25, 1.5], "texture": "#head" },
					"west": { "uv": [9, 0.5, 9.25, 1.5], "texture": "#head" },
					"up": { "uv": [9, 0.5, 8, 0.25], "texture": "#head" },
					"down": { "uv": [10, 0.25, 9, 0.5], "texture": "#head" }
				}
			},
			{
				"from": [10, 4, 7],
				"to": [11, 6, 8],
				"faces": {
					"north": { "uv": [0.75, 0.25, 1, 0.75], "texture": "#head" },
					"east": { "uv": [0.5, 0.25, 0.75, 0.75], "texture": "#head" },
					"south": { "uv": [1.25, 0.25, 1.5, 0.75], "texture": "#head" },
					"west": { "uv": [1, 0.25, 1.25, 0.75], "texture": "#head" },
					"up": { "uv": [1, 0.25, 0.75, 0], "texture": "#head" },
					"down": { "uv": [1.25, 0, 1, 0.25], "texture": "#head" }
				}
			},
			{
				"from": [5, 4, 7],
				"to": [6, 6, 8],
				"faces": {
					"north": { "uv": [0.75, 1.25, 1, 1.75], "texture": "#head" },
					"east": { "uv": [0.5, 1.25, 0.75, 1.75], "texture": "#head" },
					"south": { "uv": [1.25, 1.25, 1.5, 1.75], "texture": "#head" },
					"west": { "uv": [1, 1.25, 1.25, 1.75], "texture": "#head" },
					"up": { "uv": [1, 1.25, 0.75, 1], "texture": "#head" },
					"down": { "uv": [1.25, 1, 1, 1.25], "texture": "#head" }
				}
			},
			{
				"name": "earRight",
				"from": [12, 5, 10],
				"to": [13, 10, 14],
				"rotation": { "angle": 22.5, "axis": "z", "origin": [12, 10, 12] },
				"faces": {
					"north": { "uv": [10.75, 2.5, 11, 3.75], "texture": "#head" },
					"east": { "uv": [9.75, 2.5, 10.75, 3.75], "texture": "#head" },
					"south": { "uv": [12, 2.5, 12.25, 3.75], "texture": "#head" },
					"west": { "uv": [11, 2.5, 12, 3.75], "texture": "#head" },
					"up": { "uv": [11, 2.5, 10.75, 1.5], "texture": "#head" },
					"down": { "uv": [11.25, 1.5, 11, 2.5], "texture": "#head" }
				}
			},
			{
				"name": "earLeft",
				"from": [3, 5, 10],
				"to": [4, 10, 14],
				"rotation": { "angle": -22.5, "axis": "z", "origin": [4, 10, 12] },
				"faces": {
					"north": { "uv": [13.75, 2.5, 14, 3.75], "texture": "#head" },
					"east": { "uv": [12.75, 2.5, 13.75, 3.75], "texture": "#head" },
					"south": { "uv": [15, 2.5, 15.25, 3.75], "texture": "#head" },
					"west": { "uv": [14, 2.5, 15, 3.75], "texture": "#head" },
					"up": { "uv": [14, 2.5, 13.75, 1.5], "texture": "#head" },
					"down": { "uv": [14.25, 1.5, 14, 2.5], "texture": "#head" }
				}
			}
		]
	},
	// dragon head
	"assets/minecraft/blockstates/dragon_head.json": {
		"variants": {
			"facing=north": { "model": "block/dragon_head" },
			"facing=east": { "model": "block/dragon_head", "y": 90 },
			"facing=south": { "model": "block/dragon_head", "y": 180 },
			"facing=west": { "model": "block/dragon_head", "y": 270 }
		}
	},
	"assets/minecraft/blockstates/dragon_wall_head.json": {
		"variants": {
			"facing=north": { "model": "block/dragon_head", "y": 180 },
			"facing=east": { "model": "block/dragon_head", "y": 270 },
			"facing=south": { "model": "block/dragon_head" },
			"facing=west": { "model": "block/dragon_head", "y": 90 },
		}
	},
	"assets/minecraft/models/block/dragon_head.json": {
		"textures": {
			"dragon": "entity/enderdragon/dragon"
		},
		"elements": [
			{
				"from": [2, 4, -14],
				"to": [14, 9, 2],
				"faces": {
					"north": { "uv": [12.75, 3.75, 12, 4.0625], "texture": "#dragon" },
					"east": { "uv": [13.75, 3.75, 12.75, 4.0625], "texture": "#dragon" },
					"south": { "uv": [14.5, 3.75, 13.75, 4.0625], "texture": "#dragon" },
					"west": { "uv": [12, 3.75, 11, 4.0625], "texture": "#dragon" },
					"up": { "uv": [12, 3.75, 12.75, 2.75], "texture": "#dragon" },
					"down": { "uv": [12.75, 2.75, 13.5, 3.75], "texture": "#dragon" }
				}
			},
			{
				"from": [0, 0, 0],
				"to": [16, 16, 16],
				"faces": {
					"north": { "uv": [9, 2.875, 8, 3.875], "texture": "#dragon" },
					"east": { "uv": [10, 2.875, 9, 3.875], "texture": "#dragon" },
					"south": { "uv": [11, 2.875, 10, 3.875], "texture": "#dragon" },
					"west": { "uv": [8, 2.875, 7, 3.875], "texture": "#dragon" },
					"up": { "uv": [8, 2.875, 9, 1.875], "texture": "#dragon" },
					"down": { "uv": [9, 1.875, 10, 2.875], "texture": "#dragon" }
				}
			},
			{
				"from": [3, 16, 6],
				"to": [5, 20, 12],
				"faces": {
					"north": { "uv": [0.5, 0.375, 0.375, 0.625], "texture": "#dragon" },
					"east": { "uv": [0.875, 0.375, 0.5, 0.625], "texture": "#dragon" },
					"south": { "uv": [1, 0.375, 0.875, 0.625], "texture": "#dragon" },
					"west": { "uv": [0.375, 0.375, 0, 0.625], "texture": "#dragon" },
					"up": { "uv": [0.375, 0.375, 0.5, 0], "texture": "#dragon" },
					"down": { "uv": [0.5, 0, 0.625, 0.375], "texture": "#dragon" }
				}
			},
			{
				"from": [3, 9, -12],
				"to": [5, 11, -8],
				"faces": {
					"north": { "uv": [7.375, 0.25, 7.25, 0.375], "texture": "#dragon" },
					"east": { "uv": [7.625, 0.25, 7.375, 0.375], "texture": "#dragon" },
					"south": { "uv": [7.75, 0.25, 7.625, 0.375], "texture": "#dragon" },
					"west": { "uv": [7.25, 0.25, 7, 0.375], "texture": "#dragon" },
					"up": { "uv": [7.25, 0.25, 7.375, 0], "texture": "#dragon" },
					"down": { "uv": [7.375, 0, 7.5, 0.25], "texture": "#dragon" }
				}
			},
			{
				"from": [11, 16, 6],
				"to": [13, 20, 12],
				"faces": {
					"north": { "uv": [0.5, 0.375, 0.375, 0.625], "texture": "#dragon" },
					"east": { "uv": [0.875, 0.375, 0.5, 0.625], "texture": "#dragon" },
					"south": { "uv": [1, 0.375, 0.875, 0.625], "texture": "#dragon" },
					"west": { "uv": [0.375, 0.375, 0, 0.625], "texture": "#dragon" },
					"up": { "uv": [0.375, 0.375, 0.5, 0], "texture": "#dragon" },
					"down": { "uv": [0.5, 0, 0.625, 0.375], "texture": "#dragon" }
				}
			},
			{
				"from": [11, 9, -12],
				"to": [13, 11, -8],
				"faces": {
					"north": { "uv": [7.25, 0.25, 7.375, 0.375], "texture": "#dragon" },
					"east": { "uv": [7, 0.25, 7.25, 0.375], "texture": "#dragon" },
					"south": { "uv": [7.625, 0.25, 7.75, 0.375], "texture": "#dragon" },
					"west": { "uv": [7.375, 0.25, 7.625, 0.375], "texture": "#dragon" },
					"up": { "uv": [7.375, 0.25, 7.25, 0], "texture": "#dragon" },
					"down": { "uv": [7.5, 0, 7.375, 0.25], "texture": "#dragon" }
				}
			},
			{
				"from": [2, 0, -14],
				"to": [14, 4, 2],
				"faces": {
					"north": { "uv": [12.75, 5.0625, 12, 5.3125], "texture": "#dragon" },
					"east": { "uv": [13.75, 5.0625, 12.75, 5.3125], "texture": "#dragon" },
					"south": { "uv": [14.5, 5.0625, 13.75, 5.3125], "texture": "#dragon" },
					"west": { "uv": [12, 5.0625, 11, 5.3125], "texture": "#dragon" },
					"up": { "uv": [12, 5.0625, 12.75, 4.0625], "texture": "#dragon" },
					"down": { "uv": [12.75, 4.0625, 13.5, 5.0625], "texture": "#dragon" }
				}
			}
		]
	},
	"assets/minecraft/blockstates/copper_golem_statue.json": {
		"variants": {
			"facing=north": { "model": "block/copper_golem_statue" },
			"facing=east": { "model": "block/copper_golem_statue", "y": 90 },
			"facing=south": { "model": "block/copper_golem_statue", "y": 180 },
			"facing=west": { "model": "block/copper_golem_statue", "y": 270 },
		}
	},
	"assets/minecraft/blockstates/exposed_copper_golem_statue.json": {
		"variants": {
			"facing=north": { "model": "block/exposed_copper_golem_statue" },
			"facing=east": { "model": "block/exposed_copper_golem_statue", "y": 90 },
			"facing=south": { "model": "block/exposed_copper_golem_statue", "y": 180 },
			"facing=west": { "model": "block/exposed_copper_golem_statue", "y": 270 },
		}
	},
	"assets/minecraft/blockstates/oxidized_copper_golem_statue.json": {
		"variants": {
			"facing=north": { "model": "block/oxidized_copper_golem_statue" },
			"facing=east": { "model": "block/oxidized_copper_golem_statue", "y": 90 },
			"facing=south": { "model": "block/oxidized_copper_golem_statue", "y": 180 },
			"facing=west": { "model": "block/oxidized_copper_golem_statue", "y": 270 },
		}
	},
	"assets/minecraft/blockstates/weathered_copper_golem_statue.json": {
		"variants": {
			"facing=north": { "model": "block/weathered_copper_golem_statue" },
			"facing=east": { "model": "block/weathered_copper_golem_statue", "y": 90 },
			"facing=south": { "model": "block/weathered_copper_golem_statue", "y": 180 },
			"facing=west": { "model": "block/weathered_copper_golem_statue", "y": 270 },
		}
	},
	"assets/minecraft/blockstates/waxed_copper_golem_statue.json": {
		"variants": {
			"facing=north": { "model": "block/copper_golem_statue" },
			"facing=east": { "model": "block/copper_golem_statue", "y": 90 },
			"facing=south": { "model": "block/copper_golem_statue", "y": 180 },
			"facing=west": { "model": "block/copper_golem_statue", "y": 270 },
		}
	},
	"assets/minecraft/blockstates/waxed_exposed_copper_golem_statue.json": {
		"variants": {
			"facing=north": { "model": "block/exposed_copper_golem_statue" },
			"facing=east": { "model": "block/exposed_copper_golem_statue", "y": 90 },
			"facing=south": { "model": "block/exposed_copper_golem_statue", "y": 180 },
			"facing=west": { "model": "block/exposed_copper_golem_statue", "y": 270 },
		}
	},
	"assets/minecraft/blockstates/waxed_oxidized_copper_golem_statue.json": {
		"variants": {
			"facing=north": { "model": "block/oxidized_copper_golem_statue" },
			"facing=east": { "model": "block/oxidized_copper_golem_statue", "y": 90 },
			"facing=south": { "model": "block/oxidized_copper_golem_statue", "y": 180 },
			"facing=west": { "model": "block/oxidized_copper_golem_statue", "y": 270 },
		}
	},
	"assets/minecraft/blockstates/waxed_weathered_copper_golem_statue.json": {
		"variants": {
			"facing=north": { "model": "block/weathered_copper_golem_statue" },
			"facing=east": { "model": "block/weathered_copper_golem_statue", "y": 90 },
			"facing=south": { "model": "block/weathered_copper_golem_statue", "y": 180 },
			"facing=west": { "model": "block/weathered_copper_golem_statue", "y": 270 },
		}
	},
	"assets/minecraft/models/block/copper_golem_statue.json": {
		"textures": {
			"copper_golem": "entity/copper_golem/copper_golem"
		},
		"elements": [
			{
				"name": "body",
				"from": [4, 5, 5],
				"to": [12, 11, 11],
				"rotation": { "angle": 0, "axis": "y", "origin": [8, 0, 8] },
				"faces": {
					"north": { "uv": [1.5, 5.25, 3.5, 6.75], "texture": "#copper_golem" },
					"east": { "uv": [0, 5.25, 1.5, 6.75], "texture": "#copper_golem" },
					"south": { "uv": [5, 5.25, 7, 6.75], "texture": "#copper_golem" },
					"west": { "uv": [3.5, 5.25, 5, 6.75], "texture": "#copper_golem" },
					"up": { "uv": [3.5, 5.25, 1.5, 3.75], "texture": "#copper_golem" },
					"down": { "uv": [5.5, 3.75, 3.5, 5.25], "texture": "#copper_golem" }
				}
			},
			{
				"name": "head",
				"from": [4, 11, 3],
				"to": [12, 16, 13],
				"rotation": { "angle": 0, "axis": "y", "origin": [8, 0, 8] },
				"faces": {
					"north": { "uv": [2.5, 2.5, 4.5, 3.75], "texture": "#copper_golem" },
					"east": { "uv": [0, 2.5, 2.5, 3.75], "texture": "#copper_golem" },
					"south": { "uv": [7, 2.5, 9, 3.75], "texture": "#copper_golem" },
					"west": { "uv": [4.5, 2.5, 7, 3.75], "texture": "#copper_golem" },
					"up": { "uv": [4.5, 2.5, 2.5, 0], "texture": "#copper_golem" },
					"down": { "uv": [6.5, 0, 4.5, 2.5], "texture": "#copper_golem" }
				}
			},
			{
				"name": "head",
				"from": [7, 10, 2],
				"to": [9, 13, 4],
				"rotation": { "angle": 0, "axis": "y", "origin": [8, 0, 8] },
				"faces": {
					"north": { "uv": [14.5, 0.5, 15, 1.25], "texture": "#copper_golem" },
					"east": { "uv": [14, 0.5, 14.5, 1.25], "texture": "#copper_golem" },
					"south": { "uv": [15.5, 0.5, 16, 1.25], "texture": "#copper_golem" },
					"west": { "uv": [15, 0.5, 15.5, 1.25], "texture": "#copper_golem" },
					"up": { "uv": [15, 0.5, 14.5, 0], "texture": "#copper_golem" },
					"down": { "uv": [15.5, 0, 15, 0.5], "texture": "#copper_golem" }
				}
			},
			{
				"name": "head",
				"from": [7, 16, 7],
				"to": [9, 20, 9],
				"rotation": { "angle": 0, "axis": "y", "origin": [8, 0, 8] },
				"faces": {
					"north": { "uv": [9.75, 2.5, 10.25, 3.5], "texture": "#copper_golem" },
					"east": { "uv": [9.25, 2.5, 9.75, 3.5], "texture": "#copper_golem" },
					"south": { "uv": [10.75, 2.5, 11.25, 3.5], "texture": "#copper_golem" },
					"west": { "uv": [10.25, 2.5, 10.75, 3.5], "texture": "#copper_golem" },
					"up": { "uv": [10.25, 2.5, 9.75, 2], "texture": "#copper_golem" },
					"down": { "uv": [10.75, 2, 10.25, 2.5], "texture": "#copper_golem" }
				}
			},
			{
				"name": "head",
				"from": [6, 20, 6],
				"to": [10, 24, 10],
				"rotation": { "angle": 0, "axis": "y", "origin": [8, 0, 8] },
				"faces": {
					"north": { "uv": [10.25, 1, 11.25, 2], "texture": "#copper_golem" },
					"east": { "uv": [9.25, 1, 10.25, 2], "texture": "#copper_golem" },
					"south": { "uv": [12.25, 1, 13.25, 2], "texture": "#copper_golem" },
					"west": { "uv": [11.25, 1, 12.25, 2], "texture": "#copper_golem" },
					"up": { "uv": [11.25, 1, 10.25, 0], "texture": "#copper_golem" },
					"down": { "uv": [12.25, 0, 11.25, 1], "texture": "#copper_golem" }
				}
			},
			{
				"name": "right_arm",
				"from": [12, 2, 6],
				"to": [15, 12, 10],
				"rotation": { "angle": 0, "axis": "y", "origin": [8, 0, 8] },
				"faces": {
					"north": { "uv": [10, 5, 10.75, 7.5], "texture": "#copper_golem" },
					"east": { "uv": [9, 5, 10, 7.5], "texture": "#copper_golem" },
					"south": { "uv": [11.75, 5, 12.5, 7.5], "texture": "#copper_golem" },
					"west": { "uv": [10.75, 5, 11.75, 7.5], "texture": "#copper_golem" },
					"up": { "uv": [10.75, 5, 10, 4], "texture": "#copper_golem" },
					"down": { "uv": [11.5, 4, 10.75, 5], "texture": "#copper_golem" }
				}
			},
			{
				"name": "left_arm",
				"from": [1, 2, 6],
				"to": [4, 12, 10],
				"rotation": { "angle": 0, "axis": "y", "origin": [8, 0, 8] },
				"faces": {
					"north": { "uv": [13.5, 5, 14.25, 7.5], "texture": "#copper_golem" },
					"east": { "uv": [12.5, 5, 13.5, 7.5], "texture": "#copper_golem" },
					"south": { "uv": [15.25, 5, 16, 7.5], "texture": "#copper_golem" },
					"west": { "uv": [14.25, 5, 15.25, 7.5], "texture": "#copper_golem" },
					"up": { "uv": [14.25, 5, 13.5, 4], "texture": "#copper_golem" },
					"down": { "uv": [15, 4, 14.25, 5], "texture": "#copper_golem" }
				}
			},
			{
				"name": "right_leg",
				"from": [7.9, 0, 6.01],
				"to": [11.9, 5, 10.01],
				"rotation": { "angle": 0, "axis": "y", "origin": [8, 0, 8] },
				"faces": {
					"north": { "uv": [1, 7.75, 2, 9], "texture": "#copper_golem" },
					"east": { "uv": [0, 7.75, 1, 9], "texture": "#copper_golem" },
					"south": { "uv": [3, 7.75, 4, 9], "texture": "#copper_golem" },
					"west": { "uv": [2, 7.75, 3, 9], "texture": "#copper_golem" },
					"up": { "uv": [2, 7.75, 1, 6.75], "texture": "#copper_golem" },
					"down": { "uv": [3, 6.75, 2, 7.75], "texture": "#copper_golem" }
				}
			},
			{
				"name": "left_leg",
				"from": [4.1, 0, 6],
				"to": [8.1, 5, 10],
				"rotation": { "angle": 0, "axis": "y", "origin": [8, 0, 8] },
				"faces": {
					"north": { "uv": [5, 7.75, 6, 9], "texture": "#copper_golem" },
					"east": { "uv": [4, 7.75, 5, 9], "texture": "#copper_golem" },
					"south": { "uv": [7, 7.75, 8, 9], "texture": "#copper_golem" },
					"west": { "uv": [6, 7.75, 7, 9], "texture": "#copper_golem" },
					"up": { "uv": [6, 7.75, 5, 6.75], "texture": "#copper_golem" },
					"down": { "uv": [7, 6.75, 6, 7.75], "texture": "#copper_golem" }
				}
			}
		]
	},
	"assets/minecraft/models/block/exposed_copper_golem_statue.json": {
		parent: "block/copper_golem_statue",
		textures: {
			"copper_golem": "entity/copper_golem/exposed_copper_golem",
		},
	},
	"assets/minecraft/models/block/oxidized_copper_golem_statue.json": {
		parent: "block/copper_golem_statue",
		textures: {
			"copper_golem": "entity/copper_golem/oxidized_copper_golem",
		},
	},
	"assets/minecraft/models/block/weathered_copper_golem_statue.json": {
		parent: "block/copper_golem_statue",
		textures: {
			"copper_golem": "entity/copper_golem/weathered_copper_golem",
		},
	},
};