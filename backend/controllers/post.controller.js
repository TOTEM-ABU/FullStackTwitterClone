import Post from "../models/post.model.js";
import User from "../models/user.model.js";
import Notification from "../models/notification.model.js";
import { v2 as cloudinary } from "cloudinary";

export const createPost = async (req, res) => {
  try {
    const { text } = req.body;
    let { img } = req.body;
    const userId = req.user?._id?.toString();

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!text && !img) {
      return res
        .status(400)
        .json({ message: "Please provide either a text or an image." });
    }

    if (img) {
      const uploadedResponse = await cloudinary.uploader.upload(img);
      img = uploadedResponse.secure_url;
    }

    const newPost = new Post({
      user: userId,
      text,
      img,
    });

    await newPost.save();
    res.status(201).json(newPost);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "An error occurred while creating the post.",
      message: error.message,
    });
  }
};

export const deletePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id); // ID bo'yicha postni topamiz

    if (!post) {
      return res.status(404).json({ message: "Post not found!" });
    }

    // Post egasini tekshirish
    if (post.user.toString() !== req.user._id.toString()) {
      return res
        .status(401)
        .json({ message: "You are not authorized to delete this post" });
    }

    // Agar rasm bo'lsa, Cloudinary'dan o'chirish
    if (post.img) {
      const imgId = post.img.split("/").pop().split(".")[0];
      await cloudinary.uploader.destroy(imgId);
    }

    await Post.findByIdAndDelete(req.params.id);
    res.json({ message: "Post deleted successfully!" });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      error: "An error occurred while deleting the post!",
      message: error.message,
    });
  }
};

export const commentOnPost = async (req, res) => {
  try {
    const { text } = req.body;
    const postId = req.params.id;
    const userId = req.user._id;

    if (!text) {
      return res.status(400).json({ message: "Comment cannot be empty!" });
    }

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: "Post not found!" });
    }

    const newComment = {
      user: userId,
      text,
    };

    const notification = new Notification({
      from: userId,
      to: post.user,
      type: "comment",
    });
    await notification.save();
    post.comments.push(newComment);
    await post.save();
    res.status(201).json("Comment added successfully!");
  } catch (error) {
    console.log(error);
    res.status(500).json({
      error: "An error occurred while commenting on the post!",
      message: error.message,
    });
  }
};

export const likeUnlikePost = async (req, res) => {
  try {
    const userId = req.user._id;
    const id = req.params.id;

    const post = await Post.findById(id);
    if (!post) {
      return res.status(404).json({ message: "Post not found!" });
    }

    const userLikedPost = post.likes.includes(userId);
    if (userLikedPost) {
      await Post.updateOne({ _id: id }, { $pull: { likes: userId } });
      await User.updateOne({ _id: userId }, { $pull: { likedPosts: id } });
      res.status(200).json({ message: "Post disliked!" });
    } else {
      post.likes.push(userId);
      await User.updateOne(
        { _id: userId },
        { $push: { likedPosts: post._id } }
      );
      await post.save();

      const notification = new Notification({
        from: userId,
        to: post.user,
        type: "like",
      });
      await notification.save();

      res.status(200).json({ message: "Post liked!" });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({
      error: "An error occurred while liking/disliking the post!",
      message: error.message,
    });
  }
};

export const getAllPosts = async (req, res) => {
  try {
    const posts = await Post.find()
      .sort({ createdAt: -1 })
      .populate({
        path: "user",
        select: "-password",
      })
      .populate({
        path: "comments.user",
        select: "-password",
      });
    if (posts.length === 0) {
      return res.status(404).json([]);
    }

    res.status(200).json(posts);
  } catch (error) {
    console.log(error);
    res.status(500).json({
      error: "An error occurred while fetching all posts!",
      message: error.message,
    });
  }
};

export const getLikedPosts = async (req, res) => {
  const userId = req.user.id;

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found!" });
    }

    const likedPosts = await Post.find({
      _id: { $in: user.likedPosts },
    })
      .populate({
        path: "user",
        select: "-password",
      })
      .populate({
        path: "comments.user",
        select: "-password",
      });

    res.status(200).json(likedPosts);
  } catch (error) {
    console.log(error);
    res.status(500).json({
      error: "An error occurred while fetching liked posts!",
      message: error.message,
    });
  }
};

export const getFollowingPosts = async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ message: "User not found!" });
    }

    const follwing = user.following;
    const feedPosts = await Post.find({
      user: { $in: follwing },
    })
      .sort({ createdAt: -1 })
      .populate({
        path: "user",
        select: "-password",
      })
      .populate({
        path: "comments.user",
        select: "-password",
      });

    res.status(200).json(feedPosts);
  } catch (error) {
    console.log(error);
    res.status(500).json({
      error: "An error occurred while fetching following posts!",
      message: error.message,
    });
  }
};

export const getUserPosts = async (req, res) => {
  try {
    const { username } = req.params;

    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const posts = await Post.find({ user: user._id })
      .sort({
        createdAt: -1,
      })
      .populate({
        path: "user",
        select: "-password",
      })
      .populate({
        path: "comments.user",
        select: "-password",
      });

    res.status(200).json(posts);
  } catch (error) {
    console.log(error);
    res.status(500).json({
      error: "An error occurred while fetching user's posts!",
      message: error.message,
    });
  }
};
