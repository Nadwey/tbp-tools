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

interface QualityString {
    quality: number;
    value: string;
}

export interface Recipe {
    name: string | QualityString[];
    ingredients: Ingredient[];

    cookingtime: number;
    distillruns?: number;
    distilltime?: number;
    wood?: WoodType;
    age?: number;
    color: string;
    difficulty: number;
    alcohol: number;
    lore?: QualityString | QualityString[];
    servercommands?: string[];
    playercommands?: string[];
    drinkmessages?: string[];
    drinktitle?: string;
    glint?: boolean;
    customModelData?: number[];
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
    if (!name.includes("/"))
        return name;

    const qualityStrings: QualityString[] = [];
    let quality = 0;

    name.split("/").forEach((part) => {
        qualityStrings.push({
            quality,
            value: part,
        });
        quality++;
    });

    return qualityStrings;
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

export function parseConfig(config: string): BreweryConfig {
    const parsed = YAML.parse(config);
    const recipes: { [id: string]: Recipe } = {};
    for (const id of Object.keys(parsed.recipes)) {
        const recipe = parsed.recipes[id];

        recipes[id] = {
            name: parseName(recipe.name),
            ingredients: recipe.ingredients.map(parseIngredient),
            cookingtime: recipe.cookingtime,
            distillruns: recipe.distillruns,
            distilltime: recipe.distilltime,
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
            servercommands: recipe.servercommands?.map(parseQualityString),
            playercommands: recipe.playercommands?.map(parseQualityString),
            drinkmessages: recipe.drinkmessages,
            drinktitle: recipe.drinktitle,
            glint: recipe.glint,
            customModelData: recipe.customModelData?.split("/").map(parseInt),
            effects: recipe.effects?.map(parseEffect),
        };
    }
    return {
        recipes,
    };
}
