import type { LucideIcon } from "lucide-react";
import {
  Beef,
  CakeSlice,
  CircleEllipsis,
  Coffee,
  Droplets,
  Flame,
  LayoutGrid,
  Pizza,
  Salad,
  Sandwich,
  Soup,
  UtensilsCrossed,
} from "lucide-react";

export type FoodTypeOption = {
  id: string;
  label: string;
  icon: LucideIcon;
};

export const FOOD_TYPE_OPTIONS: FoodTypeOption[] = [
  { id: "pizza", label: "პიცა", icon: Pizza },
  { id: "burger", label: "ბურგერი", icon: Sandwich },
  { id: "hotdog", label: "ჰოთ-დოგი", icon: Beef },
  { id: "salad", label: "სალათი", icon: Salad },
  { id: "khinkali", label: "ხინკალი", icon: Soup },
  { id: "hot", label: "ცხელი კერძები", icon: Flame },
  { id: "dessert", label: "დესერტი", icon: CakeSlice },
  { id: "drink", label: "სასმელი", icon: Coffee },
  { id: "snacks", label: "სნექები", icon: UtensilsCrossed },
  { id: "sauces", label: "სოუსები", icon: Droplets },
  { id: "combo", label: "კომბო მენიუ", icon: LayoutGrid },
  { id: "other", label: "სხვა", icon: CircleEllipsis },
];

export const PREP_TIME_OPTIONS = [
  { value: "5", label: "5 წთ" },
  { value: "10", label: "10 წთ" },
  { value: "15", label: "15 წთ" },
  { value: "20", label: "20 წთ" },
  { value: "25", label: "25 წთ" },
  { value: "30", label: "30 წთ" },
  { value: "45", label: "45 წთ" },
  { value: "60", label: "60 წთ" },
];

export const SPICINESS_OPTIONS = [
  { value: "none", label: "არაცხარე" },
  { value: "mild", label: "საშუალო" },
  { value: "hot", label: "ცხარე" },
  { value: "extra", label: "ძალიან ცხარე" },
];
