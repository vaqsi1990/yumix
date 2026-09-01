import { BadRequestException } from '@nestjs/common';
import {
  sanitizeCustomizationGroups,
  type CustomizationGroupWriteInput,
} from './customization.utils';
import { isComboMenuCategory } from './menu-category-order';
import { sanitizeProductVariants } from './product-sizes';

type ComboProductInput = {
  foodType?: string | null;
  categoryName?: string | null;
  variants?: { name: string; price: number }[] | null;
  customizationGroups?: CustomizationGroupWriteInput[] | null;
};

export function assertComboProductRules(input: ComboProductInput) {
  const isComboFood = input.foodType === 'combo';
  const isComboCategory = input.categoryName
    ? isComboMenuCategory(input.categoryName)
    : false;

  if (!isComboFood && !isComboCategory) return;

  if (!isComboFood || !isComboCategory) {
    throw new BadRequestException(
      'კომბო მენიუ უნდა იყოს „კომბო მენიუ“ კატეგორიაში',
    );
  }

  if (sanitizeProductVariants(input.variants ?? []).length > 0) {
    throw new BadRequestException('კომბო მენიუს ზომები არ უნდა იყოს მითითებული');
  }

  if (sanitizeCustomizationGroups(input.customizationGroups ?? []).length > 0) {
    throw new BadRequestException(
      'კომბო მენიუს ოფციები და გამონაკლისები არ უნდა იყოს მითითებული',
    );
  }
}
