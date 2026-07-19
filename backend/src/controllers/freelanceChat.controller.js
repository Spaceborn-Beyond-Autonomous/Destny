import { Contract } from "../models/Contract.model.js";
import { Freelancer } from "../models/Freelancer.model.js";
import { FreelanceChatMessage } from "../models/FreelanceChatMessage.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { getSocketServer } from "../socket.js";

const getContractAccess = async (contractId, user) => {
  const contract = await Contract.findById(contractId).lean();
  if (!contract) {
    throw new ApiError(404, "Contract not found");
  }

  const freelancer = contract.freelancerId
    ? await Freelancer.findById(contract.freelancerId).lean()
    : null;

  const isClient = contract.clientId && String(contract.clientId) === String(user?._id);
  const isFreelancer = freelancer?.userId && String(freelancer.userId) === String(user?._id);
  const isAdmin = Boolean(user?.admin);

  if (!isClient && !isFreelancer && !isAdmin) {
    throw new ApiError(403, "You do not have access to this freelance chat");
  }

  return {
    contract,
    freelancer,
    viewerRole: isAdmin ? "admin" : isFreelancer ? "freelancer" : "client",
  };
};

const formatMessage = (message) => ({
  _id: String(message._id),
  orderId: String(message.conversationId),
  conversationId: String(message.conversationId),
  conversationType: message.conversationType,
  senderId: {
    _id: String(message.senderId),
    name: message.senderName,
  },
  senderRole: message.senderRole,
  message: message.message,
  read: (message.readBy || []).some((id) => String(id) !== String(message.senderId)),
  readBy: message.readBy || [],
  createdAt: message.createdAt,
  updatedAt: message.updatedAt,
});

const getContractParticipantUserIds = async (contract, freelancer) => {
  const ids = [contract?.clientId];
  if (freelancer?.userId) {
    ids.push(freelancer.userId);
  }
  return [...new Set(ids.filter(Boolean).map(String))];
};

const getFreelanceChatMessages = asyncHandler(async (req, res) => {
  const { conversationId } = req.params;
  await getContractAccess(conversationId, req.user);

  const messages = await FreelanceChatMessage.find({
    conversationId,
    conversationType: "contract",
  })
    .sort({ createdAt: 1 })
    .limit(200)
    .lean();

  return res
    .status(200)
    .json(new ApiResponse(200, messages.map(formatMessage), "Chat messages fetched successfully"));
});

const sendFreelanceChatMessage = asyncHandler(async (req, res) => {
  const { conversationId } = req.params;
  const text = String(req.body?.message || "").trim();

  if (!text) {
    throw new ApiError(400, "Message is required");
  }

  if (text.length > 2000) {
    throw new ApiError(400, "Message must be 2000 characters or fewer");
  }

  const { contract, freelancer, viewerRole } = await getContractAccess(conversationId, req.user);

  const message = await FreelanceChatMessage.create({
    conversationId,
    conversationType: "contract",
    senderId: req.user._id,
    senderName: req.user.name || (viewerRole === "freelancer" ? "Freelancer" : "Client"),
    senderRole: viewerRole,
    message: text,
    readBy: [req.user._id],
  });

  const payload = formatMessage(message.toObject());
  const io = getSocketServer();
  if (io) {
    const event = {
      conversationId,
      message: payload,
    };
    io.to(`freelance:contract:${conversationId}`).emit("freelance-chat:message", event);

    const participantUserIds = await getContractParticipantUserIds(contract, freelancer);
    participantUserIds.forEach((userId) => {
      io.to(`user:${userId}`).emit("freelance-chat:message", event);
    });
  }

  return res.status(201).json(new ApiResponse(201, payload, "Message sent successfully"));
});

const markFreelanceChatRead = asyncHandler(async (req, res) => {
  const { conversationId } = req.params;
  const { viewerRole } = await getContractAccess(conversationId, req.user);

  await FreelanceChatMessage.updateMany(
    {
      conversationId,
      conversationType: "contract",
      senderRole: { $ne: viewerRole },
    },
    { $addToSet: { readBy: req.user._id } }
  );

  const io = getSocketServer();
  if (io) {
    const event = { conversationId, readerRole: viewerRole, userId: req.user._id };
    io.to(`freelance:contract:${conversationId}`).emit("freelance-chat:read", event);

    const { contract, freelancer } = await getContractAccess(conversationId, req.user);
    const participantUserIds = await getContractParticipantUserIds(contract, freelancer);
    participantUserIds.forEach((participantUserId) => {
      io.to(`user:${participantUserId}`).emit("freelance-chat:read", event);
    });
  }

  return res
    .status(200)
    .json(new ApiResponse(200, { conversationId }, "Chat marked as read"));
});

const getFreelanceChatSummaries = asyncHandler(async (req, res) => {
  const userId = String(req.user._id);
  const ownFreelancer = await Freelancer.findOne({ userId: req.user._id }).lean();

  const contractFilter = req.user.admin
    ? {}
    : {
        $or: [
          { clientId: req.user._id },
          ...(ownFreelancer ? [{ freelancerId: ownFreelancer._id }] : []),
        ],
      };

  const contracts = await Contract.find(contractFilter).sort({ createdAt: -1 }).lean();
  if (contracts.length === 0) {
    return res.status(200).json(new ApiResponse(200, []));
  }

  const freelancerIds = [...new Set(contracts.map((contract) => String(contract.freelancerId)).filter(Boolean))];
  const freelancers = await Freelancer.find({ _id: { $in: freelancerIds } }).lean();
  const freelancerById = new Map(freelancers.map((freelancer) => [String(freelancer._id), freelancer]));

  const contractIds = contracts.map((contract) => contract._id);
  const messages = await FreelanceChatMessage.find({
    conversationId: { $in: contractIds },
    conversationType: "contract",
  })
    .sort({ createdAt: -1 })
    .lean();

  const byContract = new Map();
  for (const message of messages) {
    const key = String(message.conversationId);
    const summary = byContract.get(key) || {
      latestMessage: message,
      unreadCount: 0,
    };

    if (
      String(message.senderId) !== userId &&
      !(message.readBy || []).some((id) => String(id) === userId)
    ) {
      summary.unreadCount += 1;
    }

    byContract.set(key, summary);
  }

  const summaries = contracts
    .map((contract) => {
      const summary = byContract.get(String(contract._id));
      if (!summary) return null;

      const freelancer = freelancerById.get(String(contract.freelancerId));
      const viewerIsFreelancer =
        ownFreelancer && String(contract.freelancerId) === String(ownFreelancer._id);

      return {
        orderId: String(contract._id),
        orderTitle: contract.title,
        lastMessage: summary.latestMessage.message,
        lastMessageTime: summary.latestMessage.createdAt,
        unreadCount: summary.unreadCount,
        participantId: viewerIsFreelancer
          ? String(contract.clientId || "")
          : String(freelancer?.userId || contract.freelancerId || ""),
        participantName: viewerIsFreelancer ? "Client" : freelancer?.name || "Freelancer",
        participantAvatar: viewerIsFreelancer ? "C" : freelancer?.avatar,
      };
    })
    .filter(Boolean)
    .sort((a, b) => new Date(b.lastMessageTime) - new Date(a.lastMessageTime));

  return res.status(200).json(new ApiResponse(200, summaries));
});

export {
  getFreelanceChatMessages,
  getFreelanceChatSummaries,
  markFreelanceChatRead,
  sendFreelanceChatMessage,
};
