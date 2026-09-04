import { DataPacket_Kind, RoomServiceClient } from "livekit-server-sdk";

import type { LiveKitServerConfiguration } from "../config";
import type {
  CampaignVideoPresentationPublisher,
  CampaignVideoPresentationPublishRequest,
} from "../presentation-handler";

export interface LiveKitPresentationRoomService {
  sendData(
    room: string,
    data: Uint8Array,
    kind: DataPacket_Kind,
    options: { destinationIdentities?: string[]; topic?: string },
  ): Promise<void>;
}

export class LiveKitCampaignVideoPresentationPublisher
  implements CampaignVideoPresentationPublisher
{
  private readonly roomService: LiveKitPresentationRoomService;

  constructor(
    configuration: LiveKitServerConfiguration,
    roomService?: LiveKitPresentationRoomService,
  ) {
    this.roomService =
      roomService ??
      new RoomServiceClient(
        configuration.url,
        configuration.apiKey,
        configuration.apiSecret,
        { requestTimeout: 8 },
      );
  }

  async publish(request: CampaignVideoPresentationPublishRequest): Promise<void> {
    await this.roomService.sendData(
      request.roomName,
      request.payload,
      DataPacket_Kind.RELIABLE,
      {
        topic: request.topic,
        ...(request.destinationIdentity
          ? { destinationIdentities: [request.destinationIdentity] }
          : {}),
      },
    );
  }
}
