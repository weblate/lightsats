import { Tip } from "@prisma/client";
import { StatusCodes } from "http-status-codes";
import { sendEmail } from "lib/email/sendEmail";
import prisma from "lib/prismadb";
import { stageTip } from "lib/stageTip";
import { getTipUrl, hasTipExpired } from "lib/utils";
import type { NextApiRequest, NextApiResponse } from "next";
import { Session, unstable_getServerSession } from "next-auth";
import { authOptions } from "pages/api/auth/[...nextauth]";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Tip | Tip[]>
) {
  const session = await unstable_getServerSession(req, res, authOptions);
  if (!session) {
    res.status(StatusCodes.UNAUTHORIZED).end();
    return;
  }

  switch (req.method) {
    case "POST":
      return handleClaimTip(session, req, res);
    default:
      res.status(StatusCodes.NOT_FOUND).end();
      return;
  }
}

async function handleClaimTip(
  session: Session,
  req: NextApiRequest,
  res: NextApiResponse<Tip>
) {
  const { id } = req.query;
  const tip = await prisma.tip.findUnique({
    where: {
      id: id as string,
    },
    include: {
      lnbitsWallet: true,
      tipper: true,
    },
  });
  if (!tip) {
    res.status(StatusCodes.NOT_FOUND).end();
    return;
  }

  const hasExpired = hasTipExpired(tip);

  if (
    tip.tippeeId ||
    session.user.id === tip.tipperId ||
    tip.status !== "UNCLAIMED" ||
    hasExpired
  ) {
    // already claimed or trying to claim their own tip
    res.status(StatusCodes.CONFLICT).end();
    return;
  }
  await stageTip(session.user.id, tip, "tippee");
  await prisma.tip.update({
    where: {
      id: id as string,
    },
    data: {
      status: "CLAIMED",
      claimed: new Date(),
      tippeeId: session.user.id,
    },
  });
  await prisma.user.update({
    where: {
      id: session.user.id,
    },
    data: {
      inJourney: true,
      journeyStep: 1,
      userType: "tippee",
    },
  });
  if (tip.tipper.email) {
    try {
      await sendEmail({
        to: tip.tipper.email,
        subject: "Your tip has been claimed!",
        html: `View your recipient's journey: <a href="${getTipUrl(
          tip,
          tip.tipper.locale
        )}">click here</a>`,
        from: `Lightsats <${process.env.EMAIL_FROM}>`,
      });
    } catch (error) {
      console.error(
        "Failed to send claimed notification email. Tip: " + tip.id
      );
    }
  }
  res.status(204).end();
}
