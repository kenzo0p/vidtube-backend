import mongoose, { isValidObjectId } from "mongoose";
import { Playlist } from "../models/playlist.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const createPlaylist = asyncHandler(async (req, res) => {
  const { name, description } = req.body;
  //TODO: create playlist
  if (!name || !description) {
    throw new ApiError(400, "All fields are required");
  }
  const existingPlaylist = await Playlist.findOne({
    $and: [{ name: name }, { owner: req.user._id }],
  });
  if (existingPlaylist) {
    throw ApiError(400, "playlist with name already exist");
  }
  const newPlaylist = await Playlist.create({
    name,
    description,
    owner: req.user._id,
  });
  if (!newPlaylist) {
    throw new ApiError(
      400,
      "something went wrong during creating th eplaylist"
    );
  }

  return res
    .status(200)
    .json(new ApiResponse(200, newPlaylist, "Playlist created successfully"));
});

const getUserPlaylists = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  //TODO: get user playlists
  if (!isValidObjectId(userId)) {
    throw new ApiError(400, "INvalid user ID");
  }
  const userPlaylist = await Playlist.aggregate([
    {
      $match: {
        owner: new mongoose.Types.ObjectId(userId),
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "videos",
        foreignField: "_id",
        as: "videos",
        pipeline: [
          {
            $lookup: {
              from: "users",
              localField: "owner",
              foreignField: "_id",
              as: "owner",
              pipeline: [
                {
                  $project: {
                    fullName: 1,
                    username: 1,
                    avatar: 1,
                  },
                },
              ],
            },
          },
          {
            $addFields: {
              owner: {
                $first: "$owner",
              },
            },
          },
          {
            $project: {
              title: 1,
              thumbnail: 1,
              description: 1,
              owner: 1,
            },
          },
        ],
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "createdBy",
        pipeline: [
          {
            $project: {
              avatar: 1,
              fullName: 1,
              username: 1,
            },
          },
        ],
      },
    },
    {
      $addFields: {
        createdBy: {
          $first: "$createdBy",
        },
      },
    },
    {
      $project: {
        videos: 1,
        createdBy: 1,
        name: 1,
        description: 1,
      },
    },
  ]).toArray();
  if (userPlaylist.length === 0) {
    throw new ApiError(504, "No Playlists found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, userPlaylist, "Playlists Fetched"));
});

const getPlaylistById = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  //TODO: get playlist by id
  if (!isValidObjectId(playlistId)) {
    throw new ApiError(400, "Invalid playlist ID");
  }

  const playlist = await Playlist.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(playlistId),
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "createdBy",
        pipeline: [
          {
            $project: {
              fullName: 1,
              username: 1,
              avatar: 1,
            },
          },
        ],
      },
    },
    {
      $addFields: {
        createdBy: {
          $first: "$createdBy",
        },
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "videos",
        foreignField: "_id",
        as: "videos",
        pipeline: [
          {
            $lookup: {
              from: "users",
              localField: "owner",
              foreignField: "_id",
              as: "owner",
              pipeline: [
                {
                  $project: {
                    fullName: 1,
                    username: 1,
                    avatar: 1,
                  },
                },
              ],
            },
          },
          {
            $addFields: {
              owner: {
                $first: "$owner",
              },
            },
          },
          {
            $project: {
              thumbnail: 1,
              title: 1,
              duration: 1,
              views: 1,
              owner: 1,
              createdAt: 1,
              updatedAt: 1,
            },
          },
        ],
      },
    },
    {
      $project: {
        videos: 1,
        description: 1,
        name: 1,
        createdBy: 1,
      },
    },
  ]);

  if (!playlist) {
    throw new ApiError(500, "Error fetching playlist");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, playlist, "Playlist Fetched"));
});

const addVideoToPlaylist = asyncHandler(async (req, res) => {
  const { playlistId, videoId } = req.params;
  if(!isValidObjectId(playlistId) || !isValidObjectId(videoId)) { 
    throw new ApiError(400 , "Invalid playlist or video id")
  }
  const playlist = await Playlist.findById(playlistId);
  if(!playlist)  {
    throw new ApiError(400 , "No such playlist found")
  }
  if(playlist.owner.toString() !== req.user._id)  {
    throw new ApiError(400 , "You are not allowed to modify this playlist")
  }
  const videoExits = playlist.videos.filter((video) => {video.toString() === videoId})
  if(videoExits.length > 0)  {
    throw new ApiError(400 , "Video already exist in the playlist")
  } 
  const addVideo = await Playlist.findByIdAndUpdate(playlistId,{$set : {videos : [...playlist.videos ,videoId]}},{new : true})  //set  for adding the videos in the playlist
  if (!addVideo)  { 
    throw new ApiError(400 , "Something went wrong during addng the video in th e playlist")
  }
  return res.status(200).json(new ApiResponse(200 , addVideo,"Video added in th e playlist successfully"))
});

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
  const { playlistId, videoId } = req.params;
  // TODO: remove video from playlist
  if(!isValidObjectId(videoId || !isValidObjectId(playlistId))){
    throw new ApiError(400 ,  "Invalid userId  , playlistId")
  }
  const playlist = await Playlist.findById(playlistId)
  if(!playlist) {
    throw new ApiError(400 , "Playlist not found")
  }
  const videoExist = await Playlist.videos.find(video => video.toString() === videoId)
  if(!videoExist)  {
    throw new ApiError(400,"No such video exist");
    
  }
  const modifyPlaylistVideo  = await Playlist.videos.find((video) => video.toString() !== videoId)
  const removeVideo = await Playlist.findByIdAndUpdate(playlistId , {$set :{videos : modifyPlaylistVideo}} , {new :true})
  if(!removeVideo)  {
    throw new ApiError(400 , "Something went wrong during removing video")
  }
});

const deletePlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  // TODO: delete playlist
});

const updatePlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  const { name, description } = req.body;
  //TODO: update playlist
});

export {
  createPlaylist,
  getUserPlaylists,
  getPlaylistById,
  addVideoToPlaylist,
  removeVideoFromPlaylist,
  deletePlaylist,
  updatePlaylist,
};
