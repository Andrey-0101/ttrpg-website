import CampaignGameRoomHeader from "@/components/campaigns/campaign-game-room-header";

type CampaignGameRoomHeaderSlotProps = {
  params: Promise<{ id: string }>;
};

export default async function CampaignGameRoomHeaderSlot({
  params,
}: CampaignGameRoomHeaderSlotProps) {
  const { id } = await params;

  return <CampaignGameRoomHeader campaignId={id} />;
}
