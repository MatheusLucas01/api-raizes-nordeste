import { ApiProperty } from '@nestjs/swagger';
import { ProductUnit, Product } from '../../generated/prisma/client';

type ProductUnitWithProduct = ProductUnit & { product?: Product };

export class MenuItemResponseDto {
  @ApiProperty({ example: 10 })
  productId: number;

  @ApiProperty({ example: 1 })
  unitId: number;

  @ApiProperty({ example: 24.9 })
  localPrice: number;

  @ApiProperty({ example: 50 })
  currentQuantity: number;

  @ApiProperty({ example: true })
  isAvailable: boolean;

  @ApiProperty({ required: false })
  product?: { id: number; name: string; category: string | null };

  constructor(pu: ProductUnitWithProduct) {
    this.productId = pu.productId;
    this.unitId = pu.unitId;
    this.localPrice = parseFloat(pu.localPrice.toString());
    this.currentQuantity = pu.currentQuantity;
    this.isAvailable = pu.isAvailable;
    if (pu.product) {
      this.product = {
        id: pu.product.id,
        name: pu.product.name,
        category: pu.product.category,
      };
    }
  }
}
