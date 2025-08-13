import Notification from "../models/notification.model.js";

export const getNotifications = async (req, res) => {
  try {
    const userId = req.user._id;

    const notifications = await Notification.find({ to: userId }).populate({
      path: "from",
      select: "username profilePicture",
    });

    await Notification.updateMany({ to: userId }, { read: true });

    res.status(200).json(notifications);
  } catch (error) {
    console.log(error);
    res.status(500).json({
      error: "Error getting notifications.",
      message: error.message,
    });
  }
};

export const deleteNotifications = async (req, res) => {
  try {
    const userId = req.user._id;

    await Notification.deleteMany({ to: userId });

    res.status(200).json({ message: "Notification deleted" });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      error: "Error deleting notification",
      message: error.message,
    });
  }
};
