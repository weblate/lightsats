import { Collapse, Loading, Spacer, Text } from "@nextui-org/react";
import { ClaimedTipCard } from "components/ClaimedTipCard";
import { DashboardButton } from "components/HomeButton";
import { Login } from "components/Login";
import { getStaticPaths, getStaticProps } from "lib/i18n/i18next";
import { Routes } from "lib/Routes";
import { defaultFetcher } from "lib/swr";
import { getCurrentUrl, hasTipExpired } from "lib/utils";
import type { NextPage } from "next";
import { useSession } from "next-auth/react";
import { useTranslation } from "next-i18next";
import Head from "next/head";
import { useRouter } from "next/router";
import React from "react";
import toast from "react-hot-toast";
import useSWR from "swr";
import { ClaimTipRequest } from "types/ClaimTipRequest";
import { PublicTip } from "types/PublicTip";

const ClaimTipPage: NextPage = () => {
  const { t } = useTranslation("claim");
  const router = useRouter();
  const { data: session, status: sessionStatus } = useSession();
  const { id } = router.query;
  const { data: publicTip, mutate: mutatePublicTip } = useSWR<PublicTip>(
    id ? `/api/tippee/tips/${id}` : null,
    defaultFetcher
  );
  const isTipper =
    session && publicTip && session.user.id === publicTip.tipperId;

  const [isClaiming, setClaiming] = React.useState(false);

  const destinationRoute = Routes.journeyClaimed;

  React.useEffect(() => {
    if (
      publicTip &&
      !publicTip.claimLinkViewed &&
      ((!session && sessionStatus !== "loading") ||
        (session && session.user.id !== publicTip.tipperId))
    ) {
      (async () => {
        const result = await fetch(`/api/tippee/tips/${id}/view`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        });
        if (!result.ok) {
          console.error("Failed to mark tip as viewed: " + result.status);
        }
      })();
    }
  }, [id, publicTip, session, sessionStatus]);

  const hasExpired = publicTip && hasTipExpired(publicTip);

  const canClaim =
    publicTip &&
    publicTip.status === "UNCLAIMED" &&
    session &&
    !isTipper &&
    !hasExpired;

  // tip was already claimed by the current user (open old link)
  React.useEffect(() => {
    if (
      session &&
      publicTip &&
      publicTip.status === "CLAIMED" &&
      publicTip.tippeeId === session.user.id &&
      !isClaiming &&
      !hasExpired
    ) {
      router.push(destinationRoute);
    }
  }, [destinationRoute, isClaiming, publicTip, router, session, hasExpired]);

  // autoclaim after login
  React.useEffect(() => {
    if (canClaim && !isClaiming) {
      setClaiming(true);
      (async () => {
        const claimTipRequest: ClaimTipRequest = {};
        const result = await fetch(`/api/tippee/tips/${id}/claim`, {
          method: "POST",
          body: JSON.stringify(claimTipRequest),
          headers: { "Content-Type": "application/json" },
        });
        if (!result.ok) {
          toast.error(
            "Failed to claim tip: " +
              result.statusText +
              ". Please refresh the page to try again."
          );
        } else {
          mutatePublicTip();
          router.push(destinationRoute);
        }
      })();
    }
  }, [canClaim, destinationRoute, isClaiming, id, mutatePublicTip, router]);

  const isLoading =
    !publicTip || sessionStatus === "loading" || canClaim || isClaiming;

  return (
    <>
      <Head>
        <title>Lightsats⚡ - Claim tip</title>
      </Head>
      {isLoading ? (
        <>
          <Loading color="currentColor" size="sm" />
        </>
      ) : publicTip.status !== "UNCLAIMED" &&
        (publicTip.status !== "CLAIMED" ||
          (session && session.user.id !== publicTip.tippeeId)) ? (
        <>
          <Text>This tip is no longer available.</Text>
          <Spacer />
          <DashboardButton />
        </>
      ) : publicTip.status === "CLAIMED" && !session ? (
        <>
          <Text>This tip has been claimed but not withdrawn yet.</Text>
          <Spacer />
          <Collapse
            bordered
            title={<Text b>This is my Tip🙋</Text>}
            css={{ width: "100%" }}
          >
            <>
              <Login
                instructionsText={() => "Confirm your account to continue"}
                callbackUrl={getCurrentUrl(router)}
                tipId={publicTip.id}
                defaultLoginMethod="phone"
              />
            </>
          </Collapse>
          <Spacer />
          <Text>Not yours?</Text>
          <Spacer />
          <DashboardButton />
        </>
      ) : isTipper ? (
        <>
          <ClaimTipView publicTip={publicTip} />
        </>
      ) : hasExpired ? (
        <>
          <Spacer y={2} />
          <Text color="error">{t("expired")}</Text>
          <Spacer />
          <DashboardButton />
        </>
      ) : (
        <ClaimTipView publicTip={publicTip} />
      )}
    </>
  );
};

export default ClaimTipPage;

type ClaimTipViewProps = {
  publicTip: PublicTip;
};

function ClaimTipView({ publicTip }: ClaimTipViewProps) {
  const { t } = useTranslation("claim");
  const router = useRouter();

  return (
    <>
      {publicTip.tippeeName && (
        <>
          <Text h3>
            {t("hello", {
              tippeeName: publicTip.tippeeName,
            })}
          </Text>
        </>
      )}
      <ClaimedTipCard publicTip={publicTip} viewing="tipper" />
      <Spacer y={3} />
      {
        <>
          <Login
            instructionsText={(loginMethod) =>
              t(`claim:instructions.${loginMethod}`)
            }
            submitText={t("claim:claim")}
            callbackUrl={getCurrentUrl(router)}
            tipId={publicTip.id}
            defaultLoginMethod="phone"
          />
        </>
      }
      <Spacer />
    </>
  );
}

export { getStaticProps, getStaticPaths };
