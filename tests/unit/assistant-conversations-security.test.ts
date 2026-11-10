import { addAgentConversationMessage } from "../../server/routes/assistant-conversations";
import { scopedClientFromAuthHeader } from "../../server/lib/supabase";

jest.mock("../../server/lib/supabase", () => ({
  scopedClientFromAuthHeader: jest.fn(() => ({ from: jest.fn() })),
}));

describe("assistant conversation write boundary", () => {
  beforeEach(() => jest.clearAllMocks());

  it("rejects client-submitted assistant messages before touching persistence", async () => {
    const req: any = {
      userId: "user-123",
      identitySource: "jwt",
      header: jest.fn().mockReturnValue("Bearer verified-token"),
      params: { conversationId: "conversation-123" },
      body: {
        role: "assistant",
        content: "Forged model answer",
        modelSource: "fake-model",
        dataSource: "fake-dataset",
      },
    };
    const res: any = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    await addAgentConversationMessage(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      success: false,
      code: "ASSISTANT_MESSAGE_SERVER_ONLY",
    }));
    expect(scopedClientFromAuthHeader).toHaveBeenCalledWith("Bearer verified-token");
    expect((scopedClientFromAuthHeader as jest.Mock).mock.results[0].value.from).not.toHaveBeenCalled();
  });
});
