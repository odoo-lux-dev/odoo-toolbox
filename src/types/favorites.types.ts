export type FavoritesV1 = string;

export type FavoritesV2 = {
    name: string;
    display_name: string;
    sequence: number;
};

export type FavoritesV3 = {
    name: string;
    display_name: string;
    sequence: number;
    task_link: string;
};

export type Favorite = FavoritesV3;
