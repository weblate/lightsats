import { Collapse, CSS, Spacer, Text } from "@nextui-org/react";
import { ItemCard } from "components/items/ItemCard";
import { DEFAULT_LOCALE } from "lib/i18n/locales";
import {
  CategoryFilterOptions,
  getOtherItems,
  getRecommendedItems,
} from "lib/items/getRecommendedItems";
import { useRouter } from "next/router";
import React from "react";
import { ItemCategory } from "types/Item";

type ItemsListProps = {
  category: ItemCategory;
  options: CategoryFilterOptions;
};

const collapseGroupCss: CSS = { width: "100%" };

export function ItemsList({ category, options }: ItemsListProps) {
  const router = useRouter();

  const recommendedItems = React.useMemo(
    () =>
      getRecommendedItems(category, router.locale || DEFAULT_LOCALE, options),
    [category, options, router.locale]
  );
  const otherItems = React.useMemo(
    () => getOtherItems(category, options, recommendedItems),
    [category, recommendedItems, options]
  );

  return (
    <>
      {otherItems.length > 0 && <h4>Recommended wallet</h4>}

      <Collapse.Group shadow={options.shadow ?? true} css={collapseGroupCss}>
        {recommendedItems.map((item) => (
          <ItemCard
            key={item.name}
            item={item}
            expanded={recommendedItems.length === 1}
          />
        ))}
      </Collapse.Group>

      {otherItems.length > 0 && (
        <>
          <Spacer />

          <Text small b h4 transform="uppercase">
            Other wallets
          </Text>
          <Collapse.Group
            shadow={options.shadow ?? true}
            css={collapseGroupCss}
          >
            {otherItems.map((item) => (
              <ItemCard key={item.name} item={item} />
            ))}
          </Collapse.Group>
        </>
      )}
    </>
  );
}
