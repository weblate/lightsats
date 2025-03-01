import { ItemsList } from "components/items/ItemsList";
import { MyBitcoinJourneyContent } from "components/tippee/MyBitcoinJourneyContent";
import { MyBitcoinJourneyFooter } from "components/tippee/MyBitcoinJourneyFooter";
import { MyBitcoinJourneyHeader } from "components/tippee/MyBitcoinJourneyHeader";
import { useReceivedTips } from "hooks/useTips";
import { CategoryFilterOptions } from "lib/items/getRecommendedItems";
import { Routes } from "lib/Routes";
import type { NextPage } from "next";
import Head from "next/head";
import { useRouter } from "next/router";
import React from "react";

const SelectWalletPage: NextPage = () => {
  const router = useRouter();
  const { data: tips } = useReceivedTips();
  const receivedTips = React.useMemo(
    () =>
      tips?.filter(
        (tip) => tip.status === "CLAIMED" || tip.status === "WITHDRAWN"
      ),
    [tips]
  );

  const categoryFilterOptions: CategoryFilterOptions = React.useMemo(
    () => ({
      checkTippeeBalance: true,
      tippeeBalance: receivedTips?.length
        ? receivedTips.map((tip) => tip.amount).reduce((a, b) => a + b)
        : 0,
      recommendedLimit: 1,
    }),
    [receivedTips]
  );

  return (
    <>
      <Head>
        <title>Lightsats⚡ - Choose a Wallet</title>
      </Head>
      <MyBitcoinJourneyHeader />

      <MyBitcoinJourneyContent>
        <ItemsList category="wallets" options={categoryFilterOptions} />
      </MyBitcoinJourneyContent>
      <MyBitcoinJourneyFooter
        href={Routes.withdraw}
        text={"Continue"}
        nextUp="Withdraw"
      />
    </>
  );
};

export default SelectWalletPage;
