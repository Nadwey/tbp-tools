import YAML from "yaml";

enum WoodType {
    ANY = "Any",
    BIRCH = "Birch",
    OAK = "Oak",
    JUNGLE = "Jungle",
    SPRUCE = "Spruce",
    ACACIA = "Acacia",
    DARK_OAK = "Dark Oak",
    CRIMSON = "Crimson",
    WARPED = "Warped",
    MANGROVE = "Mangrove",
    CHERRY = "Cherry",
    BAMBOO = "Bamboo",
}

const WOOD_TYPE_NAMES: {
    [key: number]: WoodType;
} = {
    0: WoodType.ANY,
    1: WoodType.BIRCH,
    2: WoodType.OAK,
    3: WoodType.JUNGLE,
    4: WoodType.SPRUCE,
    5: WoodType.ACACIA,
    6: WoodType.DARK_OAK,
    7: WoodType.CRIMSON,
    8: WoodType.WARPED,
    9: WoodType.MANGROVE,
    10: WoodType.CHERRY,
    11: WoodType.BAMBOO,
};

interface Ingredient {
    name: string;
    amount: number;
    namespace?: string;
}

interface EffectRange {
    worst: number;
    best: number;
}

interface Effect {
    type: string;
    level?: number | EffectRange;
    duration: number | EffectRange;
}

interface QualityValue<T> {
    quality: number;
    value: T;
}

type QualityString = QualityValue<string>;

export interface Recipe {
    name: string | QualityString[];
    ingredients: Ingredient[];

    cookingTime: number;
    distillRuns?: number;
    distillTime?: number;
    wood?: WoodType;
    age?: number;
    color: string;
    difficulty: number;
    alcohol: number;
    lore?: QualityString | QualityString[];
    serverCommands?: string[];
    playerCommands?: string[];
    drinkMessages?: string[];
    drinkTitle?: string;
    glint?: boolean;
    customModelData?: QualityValue<number>[] | number;
    effects?: Effect[];
}

export interface BreweryConfig {
    recipes: {
        [id: string]: Recipe;
    };
}

/**
 * According to the Brewery plugin, the name object should be something like: bad: string, normal: string, good: string
 * But maybe the new Brewery will introduce a new way to handle this... So we parse it as an array with the quality
 */
function parseName(name: string): string | QualityString[] {
    if (!name.includes("/")) return name;

    return name.split("/").map((part, index) => ({
        quality: index,
        value: part,
    }));
}

function parseIngredient(ingredient: string): Ingredient {
    const [nameWithNamespace, amount] = ingredient.split("/");

    const [left, right] = nameWithNamespace.split(":");

    const name = right || left;
    const namespace = right && left;

    return {
        name,
        amount: parseInt(amount),
        namespace,
    };
}

function parseEffect(effect: string): Effect {
    const [type, left, right] = effect.split("/");

    function parseEffectRange(range: string): number | EffectRange {
        const [worst, best] = range.split("-");
        return best ? { worst: parseInt(worst), best: parseInt(best) } : parseInt(worst);
    }

    let level;
    let duration;

    if (right) {
        duration = parseEffectRange(right);
        level = parseEffectRange(left);
    } else {
        duration = parseEffectRange(left);
    }

    return {
        type,
        level,
        duration,
    };
}

function parseQualityString(qualityString: string): QualityString {
    let quality = 0;

    qualityString.split("").some((char) => {
        if (char === "+") quality++;
        else return true;
    });

    return {
        quality,
        value: qualityString.replace(/^\++ ?/, ""),
    };
}

function parseCustomModelData(customModelData: string | number): QualityValue<number>[] | number {
    if (typeof customModelData === "number") return customModelData;

    return customModelData.split("/").map((part, index) => ({
        quality: index,
        value: parseInt(part),
    }));
}

interface ConfigParseResult {
    success: boolean;
    config?: BreweryConfig;
    error?: {
        stage: string;
        message: string;
        stack?: string;
    };
}

function checkConfig(config: any) {
    if (config === null) throw new Error(`config is null,\nyou probably pasted an empty string`);

    if (typeof config !== "object")
        throw new Error(`config is not an object, it's a ${typeof config}\nfor some reason...`);

    if (config.recipes === undefined)
        throw new Error(
            `recipes not found,\nmake sure you pasted the entire config,\nor at least the entire "recipes" object including the key`,
        );

    if (config.recipes === null)
        throw new Error(`recipes is null,\nthis can happen if you only pasted the key "recipes" without the object`);

    if (typeof config.recipes !== "object")
        throw new Error(`recipes is not an object, it's a ${typeof config.recipes}`);
}

export function parseConfig(config: string): ConfigParseResult {
    let stage = "warming up";
    try {
        stage = "parsing yaml";
        const parsed = YAML.parse(config);

        stage = "checking config";
        checkConfig(parsed);

        stage = "parsing recipes";
        const recipes: { [id: string]: Recipe } = {};
        for (const id of Object.keys(parsed.recipes)) {
            stage = `parsing recipe with id "${id}"`;
            const recipe = parsed.recipes[id];

            recipes[id] = {
                name: parseName(recipe.name),
                ingredients: recipe.ingredients.map(parseIngredient),
                cookingTime: recipe.cookingtime,
                distillRuns: recipe.distillruns,
                distillTime: recipe.distilltime,
                wood: WOOD_TYPE_NAMES[recipe.wood || 0],
                age: recipe.age,
                color: recipe.color,
                difficulty: recipe.difficulty,
                alcohol: recipe.alcohol,
                lore:
                    recipe.lore &&
                    (typeof recipe.lore === "string"
                        ? parseQualityString(recipe.lore)
                        : recipe.lore.map(parseQualityString)),
                serverCommands: recipe.servercommands?.map(parseQualityString),
                playerCommands: recipe.playercommands?.map(parseQualityString),
                drinkMessages: recipe.drinkmessages,
                drinkTitle: recipe.drinktitle,
                glint: recipe.glint,
                customModelData: recipe.customModelData && parseCustomModelData(recipe.customModelData),
                effects: recipe.effects?.map(parseEffect),
            };
        }
        return {
            success: true,
            config: {
                recipes,
            },
        };
    } catch (error) {
        let message = "unexpected error, please check console and report it";
        let stack = "stack not available";
        if (error instanceof Error) {
            message = error.message;
            stack = error.stack || "??? - check console";
        } else console.error(error);

        return {
            success: false,
            error: {
                stage,
                message,
                stack,
            },
        };
    }
}
