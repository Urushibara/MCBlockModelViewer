export const mock_datas = {
	"assets/minecraft/models/block/coral_fans.json": {
		"ambientocclusion": false,
		"textures": {
			"particle": "#fan"
		},
		"elements": [
			{
				"from": [0, 0, 0],
				"to": [16, 0, 16],
				"shade": false,
				"faces": {
					"up": { "uv": [0, 0, 16, 16], "texture": "#fan", "rotation": 90 },
					"down": {/*"uv": [ 0, 16, 16, 0 ],*/ "texture": "#fan", "rotation": 270 }
				}
			}
		]
	}
};

// complement blocks
export const complement_blocks = {
	"assets/minecraft/models/block/lava.json": {
		"parent": "minecraft:block/liquid",
		"textures": {
			"still": "block/lava_still",
			"flow": "block/lava_flow"
		}
	},
	"assets/minecraft/models/block/water.json": {
		"parent": "minecraft:block/liquid",
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
					"up": { "uv": [0, 0, 16, 16], "texture": "#still", "tintindex": 0 },
					"down": { "uv": [0, 0, 16, 16], "texture": "#still", "tintindex": 0 }
				}
			},
			{
				"from": [0, 0, 0],
				"to": [16, 13, 0],
				"faces": {
					"north": { "uv": [8, 9.5, 0, 16], "texture": "#flow", "tintindex": 0 },
					"south": { "uv": [8, 9.5, 0, 16], "texture": "#flow", "tintindex": 0, "cullface": "north" }
				}
			},
			{
				"from": [16, 0, 0],
				"to": [16, 13, 16],
				"faces": {
					"east": { "uv": [8, 9.5, 0, 16], "texture": "#flow", "tintindex": 0 },
					"west": { "uv": [8, 9.5, 0, 16], "texture": "#flow", "tintindex": 0, "cullface": "east" }
				}
			},
			{
				"from": [0, 0, 0],
				"to": [0, 13, 16],
				"faces": {
					"east": { "uv": [8, 9.5, 0, 16], "texture": "#flow", "tintindex": 0, "cullface": "west" },
					"west": { "uv": [8, 9.5, 0, 16], "texture": "#flow", "tintindex": 0 }
				}
			},
			{
				"from": [0, 0, 16],
				"to": [16, 13, 16],
				"faces": {
					"north": { "uv": [8, 9.5, 0, 16], "texture": "#flow", "tintindex": 0, "cullface": "south" },
					"south": { "uv": [8, 9.5, 0, 16], "texture": "#flow", "tintindex": 0 }
				}
			}
		]
	},
	// signs block models
	"assets/minecraft/models/block/oak_sign.json": { "parent": "minecraft:block/sign", "textures": { "sign": "entity/signs/oak" } },
	"assets/minecraft/models/block/spruce_sign.json": { "parent": "minecraft:block/sign", "textures": { "sign": "entity/signs/spruce" } },
	"assets/minecraft/models/block/birch_sign.json": { "parent": "minecraft:block/sign", "textures": { "sign": "entity/signs/birch" } },
	"assets/minecraft/models/block/jungle_sign.json": { "parent": "minecraft:block/sign", "textures": { "sign": "entity/signs/jungle" } },
	"assets/minecraft/models/block/acacia_sign.json": { "parent": "minecraft:block/sign", "textures": { "sign": "entity/signs/acacia" } },
	"assets/minecraft/models/block/dark_oak_sign.json": { "parent": "minecraft:block/sign", "textures": { "sign": "entity/signs/dark_oak" } },
	"assets/minecraft/models/block/mangrove_sign.json": { "parent": "minecraft:block/sign", "textures": { "sign": "entity/signs/mangrove" } },
	"assets/minecraft/models/block/cherry_sign.json": { "parent": "minecraft:block/sign", "textures": { "sign": "entity/signs/cherry" } },
	"assets/minecraft/models/block/pale_oak_sign.json": { "parent": "minecraft:block/sign", "textures": { "sign": "entity/signs/pale_oak" } },
	"assets/minecraft/models/block/bamboo_sign.json": { "parent": "minecraft:block/sign", "textures": { "sign": "entity/signs/bamboo" } },
	"assets/minecraft/models/block/crimson_sign.json": { "parent": "minecraft:block/sign", "textures": { "sign": "entity/signs/crimson" } },
	"assets/minecraft/models/block/warped_sign.json": { "parent": "minecraft:block/sign", "textures": { "sign": "entity/signs/warped" } },
	"assets/minecraft/models/block/sign.json": {
		"elements": [
			{
				"from": [7, 0, 7],
				"to": [9, 14, 9],
				"faces": {
					"north": { "uv": [0.5, 8, 1, 15], "texture": "#sign" },
					"east": { "uv": [0, 8, 0.5, 15], "texture": "#sign" },
					"south": { "uv": [1.5, 8, 2, 15], "texture": "#sign" },
					"west": { "uv": [1, 8, 1.5, 15], "texture": "#sign" },
					"up": { "uv": [1, 8, 0.5, 7], "texture": "#sign" },
					"down": { "uv": [1.5, 7, 1, 8], "texture": "#sign" }
				}
			},
			{
				"from": [-4, 14, 7],
				"to": [20, 26, 9],
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
	// wall signs blockstate
	"assets/minecraft/blockstates/oak_wall_sign.json": { "variants": { "": { "model": "minecraft:block/oak_wall_sign" } } },
	"assets/minecraft/blockstates/spruce_wall_sign.json": { "variants": { "": { "model": "minecraft:block/spruce_wall_sign" } } },
	"assets/minecraft/blockstates/birch_wall_sign.json": { "variants": { "": { "model": "minecraft:block/birch_wall_sign" } } },
	"assets/minecraft/blockstates/jungle_wall_sign.json": { "variants": { "": { "model": "minecraft:block/jungle_wall_sign" } } },
	"assets/minecraft/blockstates/acacia_wall_sign.json": { "variants": { "": { "model": "minecraft:block/acacia_wall_sign" } } },
	"assets/minecraft/blockstates/dark_oak_wall_sign.json": { "variants": { "": { "model": "minecraft:block/dark_oak_wall_sign" } } },
	"assets/minecraft/blockstates/mangrove_wall_sign.json": { "variants": { "": { "model": "minecraft:block/mangrove_wall_sign" } } },
	"assets/minecraft/blockstates/cherry_wall_sign.json": { "variants": { "": { "model": "minecraft:block/cherry_wall_sign" } } },
	"assets/minecraft/blockstates/pale_oak_wall_sign.json": { "variants": { "": { "model": "minecraft:block/pale_oak_wall_sign" } } },
	"assets/minecraft/blockstates/bamboo_wall_sign.json": { "variants": { "": { "model": "minecraft:block/bamboo_wall_sign" } } },
	"assets/minecraft/blockstates/crimson_wall_sign.json": { "variants": { "": { "model": "minecraft:block/crimson_wall_sign" } } },
	"assets/minecraft/blockstates/warped_wall_sign.json": { "variants": { "": { "model": "minecraft:block/warped_wall_sign" } } },
	// wall signs block models
	"assets/minecraft/models/block/oak_wall_sign.json": { "parent": "minecraft:block/wall_sign", "textures": { "sign": "entity/signs/oak" } },
	"assets/minecraft/models/block/spruce_wall_sign.json": { "parent": "minecraft:block/wall_sign", "textures": { "sign": "entity/signs/spruce" } },
	"assets/minecraft/models/block/birch_wall_sign.json": { "parent": "minecraft:block/wall_sign", "textures": { "sign": "entity/signs/birch" } },
	"assets/minecraft/models/block/jungle_wall_sign.json": { "parent": "minecraft:block/wall_sign", "textures": { "sign": "entity/signs/jungle" } },
	"assets/minecraft/models/block/acacia_wall_sign.json": { "parent": "minecraft:block/wall_sign", "textures": { "sign": "entity/signs/acacia" } },
	"assets/minecraft/models/block/dark_oak_wall_sign.json": { "parent": "minecraft:block/wall_sign", "textures": { "sign": "entity/signs/dark_oak" } },
	"assets/minecraft/models/block/mangrove_wall_sign.json": { "parent": "minecraft:block/wall_sign", "textures": { "sign": "entity/signs/mangrove" } },
	"assets/minecraft/models/block/cherry_wall_sign.json": { "parent": "minecraft:block/wall_sign", "textures": { "sign": "entity/signs/cherry" } },
	"assets/minecraft/models/block/pale_oak_wall_sign.json": { "parent": "minecraft:block/wall_sign", "textures": { "sign": "entity/signs/pale_oak" } },
	"assets/minecraft/models/block/bamboo_wall_sign.json": { "parent": "minecraft:block/wall_sign", "textures": { "sign": "entity/signs/bamboo" } },
	"assets/minecraft/models/block/crimson_wall_sign.json": { "parent": "minecraft:block/wall_sign", "textures": { "sign": "entity/signs/crimson" } },
	"assets/minecraft/models/block/warped_wall_sign.json": { "parent": "minecraft:block/wall_sign", "textures": { "sign": "entity/signs/warped" } },
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
	"assets/minecraft/models/block/oak_hanging_sign.json": { "parent": "minecraft:block/hanging_sign", "textures": { "sign": "entity/signs/hanging/oak" } },
	"assets/minecraft/models/block/spruce_hanging_sign.json": { "parent": "minecraft:block/hanging_sign", "textures": { "sign": "entity/signs/hanging/spruce" } },
	"assets/minecraft/models/block/birch_hanging_sign.json": { "parent": "minecraft:block/hanging_sign", "textures": { "sign": "entity/signs/hanging/birch" } },
	"assets/minecraft/models/block/jungle_hanging_sign.json": { "parent": "minecraft:block/hanging_sign", "textures": { "sign": "entity/signs/hanging/jungle" } },
	"assets/minecraft/models/block/acacia_hanging_sign.json": { "parent": "minecraft:block/hanging_sign", "textures": { "sign": "entity/signs/hanging/acacia" } },
	"assets/minecraft/models/block/dark_oak_hanging_sign.json": { "parent": "minecraft:block/hanging_sign", "textures": { "sign": "entity/signs/hanging/dark_oak" } },
	"assets/minecraft/models/block/mangrove_hanging_sign.json": { "parent": "minecraft:block/hanging_sign", "textures": { "sign": "entity/signs/hanging/mangrove" } },
	"assets/minecraft/models/block/cherry_hanging_sign.json": { "parent": "minecraft:block/hanging_sign", "textures": { "sign": "entity/signs/hanging/cherry" } },
	"assets/minecraft/models/block/pale_oak_hanging_sign.json": { "parent": "minecraft:block/hanging_sign", "textures": { "sign": "entity/signs/hanging/pale_oak" } },
	"assets/minecraft/models/block/bamboo_hanging_sign.json": { "parent": "minecraft:block/hanging_sign", "textures": { "sign": "entity/signs/hanging/bamboo" } },
	"assets/minecraft/models/block/crimson_hanging_sign.json": { "parent": "minecraft:block/hanging_sign", "textures": { "sign": "entity/signs/hanging/crimson" } },
	"assets/minecraft/models/block/warped_hanging_sign.json": { "parent": "minecraft:block/hanging_sign", "textures": { "sign": "entity/signs/hanging/warped" } },
	"assets/minecraft/models/block/hanging_sign.json": {
		"elements": [
			{
				"from": [1, 0, 7],
				"to": [15, 10, 9],
				"faces": {
					"north": {"uv": [0.5, 7, 4, 12], "texture": "#sign"},
					"east": {"uv": [0, 7, 0.5, 12], "texture": "#sign"},
					"south": {"uv": [4.5, 7, 8, 12], "texture": "#sign"},
					"west": {"uv": [4, 7, 4.5, 12], "texture": "#sign"},
					"up": {"uv": [4, 7, 0.5, 6], "texture": "#sign"},
					"down": {"uv": [7.5, 6, 4, 7], "texture": "#sign"}
				}
			},
			{
				"from": [1.5, 10, 8],
				"to": [4.5, 16, 8],
				"rotation": {"angle": 45, "axis": "y", "origin": [3, 13, 8]},
				"faces": {
					"north": {"uv": [0, 3, 0.75, 6], "texture": "#sign"},
					"south": {"uv": [0, 3, 0.75, 6], "texture": "#sign"}
				}
			},
			{
				"from": [1.5, 10, 8],
				"to": [4.5, 16, 8],
				"rotation": {"angle": -45, "axis": "y", "origin": [3, 13, 8]},
				"faces": {
					"north": {"uv": [1.5, 3, 2.25, 6], "texture": "#sign"},
					"south": {"uv": [1.5, 3, 2.25, 6], "texture": "#sign"}
				}
			},
			{
				"from": [11.5, 10, 8],
				"to": [14.5, 16, 8],
				"rotation": {"angle": 45, "axis": "y", "origin": [13, 13, 8]},
				"faces": {
					"north": {"uv": [0, 3, 0.75, 6], "texture": "#sign"},
					"south": {"uv": [0, 3, 0.75, 6], "texture": "#sign"}
				}
			},
			{
				"from": [11.5, 10, 8],
				"to": [14.5, 16, 8],
				"rotation": {"angle": -45, "axis": "y", "origin": [13, 13, 8]},
				"faces": {
					"north": {"uv": [1.5, 3, 2.25, 6], "texture": "#sign"},
					"south": {"uv": [1.5, 3, 2.25, 6], "texture": "#sign"}
				}
			}
		]
	},
	// wall hanging signs blockstate
	"assets/minecraft/blockstates/oak_wall_hanging_sign.json": { "variants": { "": { "model": "minecraft:block/oak_wall_hanging_sign" } } },
	"assets/minecraft/blockstates/spruce_wall_hanging_sign.json": { "variants": { "": { "model": "minecraft:block/spruce_wall_hanging_sign" } } },
	"assets/minecraft/blockstates/birch_wall_hanging_sign.json": { "variants": { "": { "model": "minecraft:block/birch_wall_hanging_sign" } } },
	"assets/minecraft/blockstates/jungle_wall_hanging_sign.json": { "variants": { "": { "model": "minecraft:block/jungle_wall_hanging_sign" } } },
	"assets/minecraft/blockstates/acacia_wall_hanging_sign.json": { "variants": { "": { "model": "minecraft:block/acacia_wall_hanging_sign" } } },
	"assets/minecraft/blockstates/dark_oak_wall_hanging_sign.json": { "variants": { "": { "model": "minecraft:block/dark_oak_wall_hanging_sign" } } },
	"assets/minecraft/blockstates/mangrove_wall_hanging_sign.json": { "variants": { "": { "model": "minecraft:block/mangrove_wall_hanging_sign" } } },
	"assets/minecraft/blockstates/cherry_wall_hanging_sign.json": { "variants": { "": { "model": "minecraft:block/cherry_wall_hanging_sign" } } },
	"assets/minecraft/blockstates/pale_oak_wall_hanging_sign.json": { "variants": { "": { "model": "minecraft:block/pale_oak_wall_hanging_sign" } } },
	"assets/minecraft/blockstates/bamboo_wall_hanging_sign.json": { "variants": { "": { "model": "minecraft:block/bamboo_wall_hanging_sign" } } },
	"assets/minecraft/blockstates/crimson_wall_hanging_sign.json": { "variants": { "": { "model": "minecraft:block/crimson_wall_hanging_sign" } } },
	"assets/minecraft/blockstates/warped_wall_hanging_sign.json": { "variants": { "": { "model": "minecraft:block/warped_wall_hanging_sign" } } },
	"assets/minecraft/models/block/oak_wall_hanging_sign.json": { "parent": "minecraft:block/wall_hanging_sign", "textures": { "sign": "entity/signs/hanging/oak" } },
	"assets/minecraft/models/block/spruce_wall_hanging_sign.json": { "parent": "minecraft:block/wall_hanging_sign", "textures": { "sign": "entity/signs/hanging/spruce" } },
	"assets/minecraft/models/block/birch_wall_hanging_sign.json": { "parent": "minecraft:block/wall_hanging_sign", "textures": { "sign": "entity/signs/hanging/birch" } },
	"assets/minecraft/models/block/jungle_wall_hanging_sign.json": { "parent": "minecraft:block/wall_hanging_sign", "textures": { "sign": "entity/signs/hanging/jungle" } },
	"assets/minecraft/models/block/acacia_wall_hanging_sign.json": { "parent": "minecraft:block/wall_hanging_sign", "textures": { "sign": "entity/signs/hanging/acacia" } },
	"assets/minecraft/models/block/dark_oak_wall_hanging_sign.json": { "parent": "minecraft:block/wall_hanging_sign", "textures": { "sign": "entity/signs/hanging/dark_oak" } },
	"assets/minecraft/models/block/mangrove_wall_hanging_sign.json": { "parent": "minecraft:block/wall_hanging_sign", "textures": { "sign": "entity/signs/hanging/mangrove" } },
	"assets/minecraft/models/block/cherry_wall_hanging_sign.json": { "parent": "minecraft:block/wall_hanging_sign", "textures": { "sign": "entity/signs/hanging/cherry" } },
	"assets/minecraft/models/block/pale_oak_wall_hanging_sign.json": { "parent": "minecraft:block/wall_hanging_sign", "textures": { "sign": "entity/signs/hanging/pale_oak" } },
	"assets/minecraft/models/block/bamboo_wall_hanging_sign.json": { "parent": "minecraft:block/wall_hanging_sign", "textures": { "sign": "entity/signs/hanging/bamboo" } },
	"assets/minecraft/models/block/crimson_wall_hanging_sign.json": { "parent": "minecraft:block/wall_hanging_sign", "textures": { "sign": "entity/signs/hanging/crimson" } },
	"assets/minecraft/models/block/warped_wall_hanging_sign.json": { "parent": "minecraft:block/wall_hanging_sign", "textures": { "sign": "entity/signs/hanging/warped" } },
	"assets/minecraft/models/block/wall_hanging_sign.json": {
		"elements": [
			{
				"from": [11.5, 10, 8],
				"to": [14.5, 16, 8],
				"rotation": {"angle": -45, "axis": "y", "origin": [13, 13, 8]},
				"faces": {
					"north": {"uv": [1.5, 3, 2.25, 6], "texture": "#sign"},
					"south": {"uv": [1.5, 3, 2.25, 6], "texture": "#sign"}
				}
			},
			{
				"from": [11.5, 10, 8],
				"to": [14.5, 16, 8],
				"rotation": {"angle": 45, "axis": "y", "origin": [13, 13, 8]},
				"faces": {
					"north": {"uv": [0, 3, 0.75, 6], "texture": "#sign"},
					"south": {"uv": [0, 3, 0.75, 6], "texture": "#sign"}
				}
			},
			{
				"from": [1.5, 10, 8],
				"to": [4.5, 16, 8],
				"rotation": {"angle": -45, "axis": "y", "origin": [3, 13, 8]},
				"faces": {
					"north": {"uv": [1.5, 3, 2.25, 6], "texture": "#sign"},
					"south": {"uv": [1.5, 3, 2.25, 6], "texture": "#sign"}
				}
			},
			{
				"from": [1.5, 10, 8],
				"to": [4.5, 16, 8],
				"rotation": {"angle": 45, "axis": "y", "origin": [3, 13, 8]},
				"faces": {
					"north": {"uv": [0, 3, 0.75, 6], "texture": "#sign"},
					"south": {"uv": [0, 3, 0.75, 6], "texture": "#sign"}
				}
			},
			{
				"from": [1, 0, 7],
				"to": [15, 10, 9],
				"faces": {
					"north": {"uv": [0.5, 7, 4, 12], "texture": "#sign"},
					"east": {"uv": [0, 7, 0.5, 12], "texture": "#sign"},
					"south": {"uv": [4.5, 7, 8, 12], "texture": "#sign"},
					"west": {"uv": [4, 7, 4.5, 12], "texture": "#sign"},
					"up": {"uv": [4, 7, 0.5, 6], "texture": "#sign"},
					"down": {"uv": [7.5, 6, 4, 7], "texture": "#sign"}
				}
			},
			{
				"from": [0, 14, 6],
				"to": [16, 16, 10],
				"faces": {
					"north": {"uv": [1, 2, 5, 3], "texture": "#sign"},
					"east": {"uv": [0, 2, 1, 3], "texture": "#sign"},
					"south": {"uv": [6, 2, 10, 3], "texture": "#sign"},
					"west": {"uv": [5, 2, 6, 3], "texture": "#sign"},
					"up": {"uv": [5, 2, 1, 0], "texture": "#sign"},
					"down": {"uv": [9, 0, 5, 2], "texture": "#sign"}
				}
			}
		]
	},
	"assets/minecraft/blockstates/bell.json":{
		"multipart":[
			{"apply":{"model":"minecraft:block/bell"},"when":{"attachment":"ceiling|double_wall|single_wall|floor","facing":"north|east|west|south"}},
			{"apply":{"model":"minecraft:block/bell_ceiling","y":90},"when":{"attachment":"ceiling","facing":"east"}},
			{"apply":{"model":"minecraft:block/bell_ceiling"},"when":{"attachment":"ceiling","facing":"north"}},
			{"apply":{"model":"minecraft:block/bell_ceiling","y":180},"when":{"attachment":"ceiling","facing":"south"}},
			{"apply":{"model":"minecraft:block/bell_ceiling","y":270},"when":{"attachment":"ceiling","facing":"west"}},
			{"apply":{"model":"minecraft:block/bell_between_walls"},"when":{"attachment":"double_wall","facing":"east"}},
			{"apply":{"model":"minecraft:block/bell_between_walls","y":270},"when":{"attachment":"double_wall","facing":"north"}},
			{"apply":{"model":"minecraft:block/bell_between_walls","y":90},"when":{"attachment":"double_wall","facing":"south"}},
			{"apply":{"model":"minecraft:block/bell_between_walls","y":180},"when":{"attachment":"double_wall","facing":"west"}},
			{"apply":{"model":"minecraft:block/bell_floor","y":90},"when":{"attachment":"floor","facing":"east"}},
			{"apply":{"model":"minecraft:block/bell_floor"},"when":{"attachment":"floor","facing":"north"}},
			{"apply":{"model":"minecraft:block/bell_floor","y":180},"when":{"attachment":"floor","facing":"south"}},
			{"apply":{"model":"minecraft:block/bell_floor","y":270},"when":{"attachment":"floor","facing":"west"}},
			{"apply":{"model":"minecraft:block/bell_wall"},"when":{"attachment":"single_wall","facing":"east"}},
			{"apply":{"model":"minecraft:block/bell_wall","y":270},"when":{"attachment":"single_wall","facing":"north"}},
			{"apply":{"model":"minecraft:block/bell_wall","y":90},"when":{"attachment":"single_wall","facing":"south"}},
			{"apply":{"model":"minecraft:block/bell_wall","y":180},"when":{"attachment":"single_wall","facing":"west"}}
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
					"north": {"uv": [1, 0, 7, 7], "texture": "#side"},
					"east": {"uv": [1, 0, 7, 7], "texture": "#side"},
					"south": {"uv": [1, 0, 7, 7], "texture": "#side"},
					"west": {"uv": [1, 0, 7, 7], "texture": "#side"},
					"up": {"uv": [8, 8, 0, 0], "texture": "#top"}
				}
			},
			{
				"from": [4, 4, 4],
				"to": [12, 6, 12],
				"faces": {
					"north": {"uv": [0, 7, 8, 9], "texture": "#side"},
					"east": {"uv": [0, 7, 8, 9], "texture": "#side"},
					"south": {"uv": [0, 7, 8, 9], "texture": "#side"},
					"west": {"uv": [0, 7, 8, 9], "texture": "#side"},
					"up": {"uv": [8, 8, 0, 0], "texture": "#top"},
					"down": {"uv": [8, 0, 0, 8], "texture": "#bottom"}
				}
			}
		]
	},
	"assets/minecraft/models/block/ender_chest.json":{"parent": "minecraft:block/chest", "textures": {"chest": "entity/chest/ender"}},
	"assets/minecraft/blockstates/ender_chest.json":{
		"variants": {
			"facing=north": {"model": "minecraft:block/ender_chest"},
			"facing=east": {"model": "minecraft:block/ender_chest", "y":90},
			"facing=south": {"model": "minecraft:block/ender_chest", "y":180},
			"facing=west": {"model": "minecraft:block/ender_chest","y":270},
		}
	},
	"assets/minecraft/models/block/trapped_chest.json":{"parent": "minecraft:block/chest","textures": {"chest": "entity/chest/trapped"}},
	"assets/minecraft/blockstates/trapped_chest.json":{
		"variants": {
			"facing=north": {"model": "minecraft:block/trapped_chest"},
			"facing=east": {"model": "minecraft:block/trapped_chest", "y":90},
			"facing=south": {"model": "minecraft:block/trapped_chest", "y":180},
			"facing=west": {"model": "minecraft:block/trapped_chest","y":270},
		}
	},
	"assets/minecraft/models/block/christmas_chest.json":{"parent": "minecraft:block/chest","textures": {"chest": "entity/chest/christmas"}},
	"assets/minecraft/blockstates/chest.json":{
		"variants": {
			"christmas=false,facing=north": {"model": "minecraft:block/chest"},
			"christmas=false,facing=east": {"model": "minecraft:block/chest", "y":90},
			"christmas=false,facing=south": {"model": "minecraft:block/chest", "y":180},
			"christmas=false,facing=west": {"model": "minecraft:block/chest","y":270},
			"christmas=true,facing=north": {"model": "minecraft:block/christmas_chest"},
			"christmas=true,facing=east": {"model": "minecraft:block/christmas_chest", "y":90},
			"christmas=true,facing=south": {"model": "minecraft:block/christmas_chest", "y":180},
			"christmas=true,facing=west": {"model": "minecraft:block/christmas_chest","y":270},
		}
	},
	"assets/minecraft/models/block/chest.json":{
		"textures": {
			"chest": "entity/chest/normal"
		},
		"elements": [
			{
				"from": [1, 0, 1],
				"to": [15, 10, 15],
				"faces": {
					"north": {"uv": [10.5, 8.25, 14, 10.75], "rotation": 180, "texture": "#chest"},
					"east": {"uv": [10.5, 10.75, 7, 8.25], "texture": "#chest"},
					"south": {"uv": [7, 10.75, 3.5, 8.25], "texture": "#chest"},
					"west": {"uv": [3.5, 10.75, 0, 8.25], "texture": "#chest"},
					"up": {"uv": [10.5, 8.25, 7, 4.75], "texture": "#chest"},
					"down": {"uv": [7, 8.25, 3.5, 4.75], "texture": "#chest"}
				}
			},
			{
				"from": [1, 9, 1],
				"to": [15, 14, 15],
				"faces": {
					"north": {"uv": [14, 4.75, 10.5, 3.5], "texture": "#chest"},
					"east": {"uv": [3.5, 3.5, 7, 4.75], "rotation": 180, "texture": "#chest"},
					"south": {"uv": [3.5, 3.5, 7, 4.75], "rotation": 180, "texture": "#chest"},
					"west": {"uv": [10.5, 4.75, 7, 3.5], "texture": "#chest"},
					"up": {"uv": [10.5, 0, 7, 3.5], "texture": "#chest"},
					"down": {"uv": [7, 0, 3.5, 3.5], "texture": "#chest"}
				}
			},
			{
				"from": [7, 7, 0],
				"to": [9, 11, 1],
				"faces": {
					"north": {"uv": [0.75, 1.25, 0.25, 0.25], "texture": "#chest"},
					"east": {"uv": [0.75, 1.25, 1, 0.25], "texture": "#chest"},
					"south": {"uv": [1, 0.25, 1.5, 1.25], "texture": "#chest"},
					"west": {"uv": [0, 1.25, 0.25, 0.25], "texture": "#chest"},
					"up": {"uv": [0.75, 0.25, 0.25, 0], "texture": "#chest"},
					"down": {"uv": [1.25, 0, 0.75, 0.25], "texture": "#chest"}
				}
			}
		]
	},
	"assets/minecraft/blockstates/shulker_box.json":{
		"variants": {
			"facing=down":{"model":"minecraft:block/shulker_box","x":180},
			"facing=east":{"model":"minecraft:block/shulker_box","x":90,"y":90},
			"facing=north":{"model":"minecraft:block/shulker_box","x":90},
			"facing=south":{"model":"minecraft:block/shulker_box","x":90,"y":180},
			"facing=up":{"model":"minecraft:block/shulker_box"},
			"facing=west":{"model":"minecraft:block/shulker_box","x":90,"y":270}
		}
	},
	"assets/minecraft/models/block/shulker_box.json":{
		"textures": {
			"box": "entity/shulker/shulker"
		},
		"elements": [
			{
				"from": [0, 4, 0],
				"to": [16, 16, 16],
				"faces": {
					"north": {"uv": [4, 4, 8, 7], "texture": "#box"},
					"east": {"uv": [0, 4, 4, 7], "texture": "#box"},
					"south": {"uv": [12, 4, 16, 7], "texture": "#box"},
					"west": {"uv": [8, 4, 12, 7], "texture": "#box"},
					"up": {"uv": [8, 4, 4, 0], "texture": "#box"},
					"down": {"uv": [12, 0, 8, 4], "texture": "#box"}
				}
			},
			{
				"from": [0, 0, 0],
				"to": [16, 8, 16],
				"faces": {
					"north": {"uv": [4, 11, 8, 13], "texture": "#box"},
					"east": {"uv": [0, 11, 4, 13], "texture": "#box"},
					"south": {"uv": [12, 11, 16, 13], "texture": "#box"},
					"west": {"uv": [8, 11, 12, 13], "texture": "#box"},
					"up": {"uv": [8, 11, 4, 7], "texture": "#box"},
					"down": {"uv": [12, 7, 8, 11], "texture": "#box"}
				}
			}
		]
	}
};