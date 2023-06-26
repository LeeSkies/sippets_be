const mongoose = require('mongoose');

const Filter = require('bad-words');

const Sippet = require('../../models/sippetModel');
const Buzz = require('../../models/buzzModel');
const Like = require('../../models/likeModel');
const Follow = require('../../models/followModel');
const { deleteImage } = require('./imageControllers');
const { ObjectId } = mongoose.Types
const util = require('util')

// profanity filter instance
const filter = new Filter()

// Post a new Sippet
const postSippet = async (req, res) => {
  const { blocks, language, file, hashtags } = req.body;
  const { user } = req;

  try {
    for (const block of blocks) {
      if (filter.isProfane(block.value)) {
        throw new Error('!unethical code!')
      }
    }

    const sippet = await Sippet.create({
      is: 'original',
      author: user._id,
      blocks,
      language,
      file
    });
    const buzz = new Buzz({
      user: user._id,
      text: `${user.username} posted a new sippet, go check it out!`,
      link: `/sippet/${sippet._id}`
    })
    await buzz.notifyPost(user._id)
    user.sippetsCount ++
    user.save()
    res.status(201).json({ message: 'Sippet posted successfully', sippet_id: sippet._id });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const postComment = async (req, res) => {
  const { id: sippetId } = req.params
  const { user } = req
  const { blocks, language, file, hashtags } = req.body
  try {
    for (const block of blocks) {
      if (filter.isProfane(block.value)) {
        throw new Error('!unethical code!')
      }
    }

    const sippet = await Sippet.create({
      is: 'comment',
      ref_sippet: sippetId,
      author: user._id,
      blocks,
      file,
      language 
    });
    const buzz = await Buzz.create({
      user: user._id,
      text: `${user.username} just commented, go check it out!`,
      link: `/sippet/${sippet._id}`
    })
    await buzz.notifyPost(user._id)
    await Sippet.findByIdAndUpdate(sippetId, { $inc: {commentsCount: 1}})
    res.status(201).json({ message: 'Comment posted successfully', sippet_id: sippet._id });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

// Delete a Sippet
const deleteSippet = async (req, res) => {
  const { id: sippetId } = req.params;
  const { user } = req;

  try {
    // Delete the sippet
    const sippet = await Sippet.findById(sippetId);

    if (user._id.toString() != sippet.author.toString()) {
      throw new Error('You are not the owner of this sippet');
    }

    await Sippet.findByIdAndDelete(sippetId)

    if (sippet.toastsCount > 0 || sippet.commentsCount > 0) {
      await Sippet.deleteMany({ ref_sippet: sippetId })
    }

    if (sippet.likesCount > 0) {
      await Like.deleteMany({ sippet_id: sippetId })
    }

    if (sippet.file) {
      deleteImage(sippet.file.public_id)
    }

    // Remove toast reference from original sippet
    if (sippet.is == 'comment') {
      await Sippet.updateOne({ _id: sippet.ref_sippet }, { $inc: { commentsCount: -1 } })
    }

    if (sippet.is == 'toast') {
       await Sippet.updateOne({ _id: sippet.ref_sippet }, { $inc: { toastCount: -1 } });

    await Sippet.deleteMany({ ref_sippet: sippetId })

    res.status(201).json({ message: 'Sippet deleted successfully' });
  }
  } catch (error) {
    console.log(error.message)
    res.status(500).json({ message: 'Failed to delete Sippet' });
  }
};

// Update a Sippet
const updateSippet = async (req, res) => {
  const { user } = req
  const { id: sippetId } = req.params;
  const { blocks } = req.body;

  try {
    const sippet = await Sippet.findById(sippetId);

    if (user._id != sippet.author) {
      return res.status(401).json({ message: 'You are not the owner of this sippet' });
    }

    for (const block of blocks) {
      if (filter.isProfane(block.value)) {
        return res.status(400).json({ message: '!unethical code!' })
      }
    }

    sippet.blocks = blocks;

    await sippet.save();
    res.status(201).json({});
  } catch (error) {
    res.status(500).json({ message: 'Failed to update Sippet' });
  }
};

// Like a Sippet
const likeSippet = async (req, res) => {
  const { user } = req;
  const { id: sippetId } = req.params;
  try {
    let op
    const like = await Like.findOne({ user_id: user._id, sippet_id: sippetId });
    if (like) {
      await Like.findByIdAndDelete(like._id)
      await Sippet.updateOne({ _id: sippetId }, { $inc: {likesCount: -1} })
      op = 'del'
    }
    else {
      await Like.create({
        user_id: user._id,
        sippet_id: sippetId
      });
      await Sippet.updateOne({ _id: sippetId }, { $inc: {likesCount: 1} })
      op = 'add'
    }

    res.status(201).json({ message: `Liked sippet ${sippetId}`, op });
  } catch (error) {
    console.error(error.message)
    res.status(500).json({ message: 'Failed to update like' });
  }
};

const toastSippet = async (req, res) => {
  const { id: sippetId } = req.params;
  const { user } = req;

  try {
    const isToasted = await Sippet.findOne({ author: user._id, is: 'toast', ref_sippet: sippetId });
    if (isToasted) {
      return res.status(400).json({ message: 'A sippet can be toasted once' })
    }
    await Promise.all([
      Sippet.create({
        author: user._id,
        is: 'toast',
        ref_sippet: sippetId
      }),
      Sippet.findByIdAndUpdate(sippetId, { $inc: { toastsCount: 1 } })
    ])
    res.status(201).json({ message: 'success' });
  } catch (error) {
    console.log(error.message)
    res.status(500).json({ message: 'Failed to toast sippet' })
  }
};

const getSingleSippet = async (req, res) => {
  const { id: sippetId } = req.params;
  const { user } = req
  try {
    const [sippet] = await Sippet.aggregate([
      {
        $match: {
          _id: new ObjectId(sippetId),
        }
      },
      {
        $lookup: {
          from: 'sippets',
          let: { sippet_id: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$ref_sippet', '$$sippet_id'] },
                    { $eq: ['$is', 'comment'] },
                  ],
                },
              },
            },
          ],
          as: 'comments',
        },
      },
      {
        $lookup: {
          from: 'likes',
          let: { sippet_id: '$comments._id', user_id: new ObjectId(user._id) },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$$user_id', '$user_id'] },
                    { $in: ['$sippet_id', '$$sippet_id'] },
                  ]
                }
              }
            },
            {
              $group: {
                _id: null,
                like: { $push: '$sippet_id' }
              }
            },
            {
              $unwind: '$like'
            },
          ],
          as: 'commentsLikes'
        }
      },
      {
        $lookup: {
          from: 'likes',
          let: { sippet_id: new ObjectId(sippetId), user_id: user._id },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$$user_id', '$user_id'] },
                    { $eq: ['$$sippet_id', '$sippet_id'] },
                  ]
                }
              }
            },
          ],
          as: 'liked'
        }
      },
      {
        $unwind: {
          path: '$liked',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'author',
          foreignField: '_id',
          as: 'author'
        }
      },
      {
        $unwind: '$author',
      },
      {
        $lookup: {
          from: 'follows',
          let: { author_id: '$author._id', user_id: user._id },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$follower', '$$user_id'] },
                    { $eq: ['$following', '$$author_id'] }
                  ]
                }
              }
            }
          ],
          as: 'followed'
        }
      },
      {
        $unwind: {
          path: '$followed',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'comments.author',
          foreignField: '_id',
          as: 'commentAuthors'
        }
      },
      {
        $lookup: {
          from: 'sippets',
          localField: 'ref_sippet',
          foreignField: '_id',
          as: 'ref_sippet'
        }
      },
      {
        $unwind: {
          path: '$ref_sippet',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $lookup: {
          from: 'follows',
          let: { author_id: '$ref_sippet.author', user_id: user._id },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$follower', '$$user_id'] },
                    { $eq: ['$following', '$$author_id'] }
                  ]
                }
              }
            },
            {
              $project: {
                following: 1
              }
            }
          ],
          as: 'ref_followed'  
        }
      },
      {
        $unwind: {
          path: '$ref_followed',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'ref_sippet.author',
          foreignField: '_id',
          as: 'ref_sippet.author'
        }
      },
      {
        $unwind: {
          path: '$ref_sippet.author',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $project: {
          _id: 1,
          is: 1,
          author: {
            _id: '$author._id',
            username: '$author.username',
            image: 1,
          },
          blocks: 1,
          language: 1,
          ref_sippet: {
            _id: '$ref_sippet._id',
            author: {
              _id: '$ref_sippet.author._id',
              username: '$ref_sippet.author.username',
              image: 1,
            },
            file: 1,
            blocks: '$ref_sippet.blocks',
            language: '$ref_sippet.language',
            likesCount: '$ref_sippet.likesCount',
            commentsCount: '$ref_sippet.commentsCount',
            toastsCount: '$ref_sippet.toastsCount',
            hashtags: '$ref_sippet.hashtags',
          },
          file: 1,
          ref_followed: 1,
          followed: 1,
          liked: 1,
          likesCount: 1,
          commentsCount: 1,
          toastsCount: 1,
          hashtags: 1,
          comments: 1,
          commentAuthors: 1,
          commentsLikes: 1
        }
      }
    ]).exec();

    sippet.ref_sippet.followed = sippet.ref_followed ? true : false;
    sippet.liked = sippet.liked ? true :  false
    sippet.followed = sippet.followed ? true : false

    sippet.commentsLikes = sippet.commentsLikes.map(obj => obj.like.toString())
    
    sippet.comments = sippet.comments.map(comment => {

      const [author] = sippet.commentAuthors.filter(a => {
        if (a._id.toString() == comment.author.toString())
          return { id: a._id, username: a.username, image: a?.image? a.image : null }
      })

      const liked = sippet.commentsLikes.includes(comment._id.toString())

      return {
        ...comment,
        author,
        liked,
      }
    })

    delete sippet.commentAuthors
    delete sippet.commentsLikes
    res.json(sippet)
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: 'An error occurred while fetching the sippet.' });
  }  
};

const getLatestSippets = async (req, res) => {
  const { user } = req
  const offset = req.query.offset || 0;  
  try {
    const sippets = await Sippet.aggregate([
      {
        $sort: {
          _id: -1
        }
      },
      {
        $match: { is: { $not: { $eq: 'comment' } } }
      },
      {
        $skip: offset * 10
      },
      {
        $limit: 10
      },
      {
        $lookup: {
          from: 'users',
          localField: 'author',
          foreignField: '_id',
          as: 'author'
        }
      },
      {
        $unwind: '$author'
      },
      {
        $lookup: {
          from: 'likes',
          let: { sippet_id: '$_id', user_id: new ObjectId(user._id) },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$$user_id', '$user_id'] },
                    { $eq: ['$sippet_id', '$$sippet_id'] },
                  ]
                }
              }
            },
            {
              $group: {
                _id: null,
                like: { $push: '$sippet_id' }
              }
            },
            {
              $unwind: '$like'
            },
          ],
          as: 'liked'
        }
      },
      {
        $unwind: {
          path: '$liked',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $lookup: {
          from: 'sippets',
          localField: 'ref_sippet',
          foreignField: '_id',
          as: 'ref_sippet'
        }
      },
      {
        $unwind: {
          path: '$ref_sippet',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'ref_sippet.author',
          foreignField: '_id',
          as: 'ref_sippet.author'
        }
      },
      {
        $unwind: {
          path: '$ref_sippet.author',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $project: {
          _id: 1,
          is: 1,
          author: {
            _id: '$author._id',
            username: '$author.username',
            image: 1,
          },
          ref_sippet: {
            _id: '$ref_sippet._id',
            author: {
              _id: '$ref_sippet.author._id',
              username: '$ref_sippet.author.username',
              image: 1,
            },
            file: 1,
            blocks: '$ref_sippet.blocks',
            language: '$ref_sippet.language',
            likesCount: '$ref_sippet.likesCount',
            commentsCount: '$ref_sippet.commentsCount',
            toastsCount: '$ref_sippet.toastsCount',
            hashtags: '$ref_sippet.hashtags',
            createdAt: 1,
          },
          file: 1,
          blocks: 1,
          language: 1,
          ref_sippet: 1,
          likesCount: 1,
          commentsCount: 1,
          toastsCount: 1,
          hashtags: 1,
          createdAt: 1,
          liked: 1,
        }
      }
    ]).exec();

    const finalSippets = sippets.map(sippet => {
      const liked = sippet.liked ? true : false;
      return {
        ...sippet,
        liked,
      }
    })

    res.json(finalSippets)
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: 'An error occurred while fetching the sippets.' });
  }
};

const getLikedSippets = async (req, res) => {
  const { offset } = req.query || 0
  const { user } = req

  try {
    const sippets = await Like.aggregate([
      {
        $match: {
          user_id: user._id,
        },
      },
      {
        $lookup: {
          from: 'sippets',
          localField: 'sippet_id',
          foreignField: '_id',
          as: 'sippets',
        },
      },
      {
        $unwind: '$sippets',
      },
      {
        $sort: {
          'sippets._id': -1,
        },
      },
      {
        $skip: offset * 10,
      },
      {
        $limit: 10,
      },
      {
        $lookup: {
          from: 'likes',
          let: { sippet_id: '$_id', user_id: user._id },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$$user_id', '$user_id'] },
                    { $eq: ['$$sippet_id', '$sippet_id'] },
                  ]
                }
              }
            }
          ],
          as: 'liked'
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'sippets.author',
          foreignField: '_id',
          as: 'sippets.author',
        },
      },
      {
        $unwind: '$sippets.author',
      },
      {
        $lookup: {
          from: 'sippets',
          localField: 'sippets.ref_sippet',
          foreignField: '_id',
          as: 'sippets.ref_sippet',
        },
      },
      {
        $unwind: {
          path: '$sippets.ref_sippet',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: 'sippets.ref_sippet.author',
          foreignField: '_id',
          as: 'sippets.ref_sippet.author',
        },
      },
      {
        $unwind: {
          path: '$sippets.ref_sippet.author',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          _id: '$sippets._id',
          is: '$sippets.is',
          author: {
            _id: '$sippets.author._id',
            username: '$sippets.author.username',
            image: 1,
          },
          blocks: '$sippets.blocks',
          language: '$sippets.language',
          ref_sippet: {
            _id: '$sippets.ref_sippet._id',
            author: {
              _id: '$sippets.ref_sippet.author._id',
              username: '$sippets.ref_sippet.author.username',
              image: 1,
            },
            blocks: '$sippets.ref_sippet.blocks',
            language: '$sippets.ref_sippet.language',
            likesCount: '$sippets.ref_sippet.likesCount',
            commentsCount: '$sippets.ref_sippet.commentsCount',
            toastsCount: '$sippets.ref_sippet.toastsCount',
            hashtags: '$sippets.ref_sippet.hashtags',
            createdAt: 1,
          },
          file: 1,
          likesCount: '$sippets.likesCount',
          commentsCount: '$sippets.commentsCount',
          toastsCount: '$sippets.toastsCount',
          hashtags: '$sippets.hashtags',
          createdAt: 1,
          liked: 1,
          followed: 1,
        },
      },
    ]).exec();
    res.status(200).json(sippets)
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ message: 'Failed to fetch sippets' })
  }
}

const getFollowingSippets = async (req, res) => {
  const { offset } = req.query || 0
  const { user } = req

  try {
    const sippets = await Follow.aggregate([
      {
        $match: { $and: [
          { follower: user._id },
          { is: { $not: { $eq: 'comment'} } }
        ]},
      },
      {
        $lookup: {
          from: 'sippets',
          let: {following: '$following'},
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    {$ne: ['$is', 'comment']},
                    {$eq: ['$author', '$$following']}
                  ]
                }
              }
            }
          ],
          as: 'sippets',
        },
      },
      {
        $unwind: '$sippets',
      },
      {
        $sort: {
          'sippets._id': -1,
        },
      },
      {
        $skip: offset * 10,
      },
      {
        $limit: 10,
      },
      {
        $lookup: {
          from: 'likes',
          let: { sippet_id: '$sippets._id', user_id: user._id },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$$user_id', '$user_id'] },
                    { $eq: ['$$sippet_id', '$sippet_id'] },
                  ]
                }
              }
            },
            {
              $group: {
                _id: null,
                like: { $push: '$sippet_id' }
              }
            },
            {
              $unwind: '$like'
            },
          ],
          as: 'liked'
        }
      },
      {
        $unwind: {
          path: '$liked',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'sippets.author',
          foreignField: '_id',
          as: 'sippets.author',
        },
      },
      {
        $unwind: '$sippets.author',
      },
      {
        $lookup: {
          from: 'sippets',
          localField: 'sippets.ref_sippet',
          foreignField: '_id',
          as: 'sippets.ref_sippet',
        },
      },
      {
        $unwind: {
          path: '$sippets.ref_sippet',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: 'sippets.ref_sippet.author',
          foreignField: '_id',
          as: 'sippets.ref_sippet.author',
        },
      },
      {
        $unwind: {
          path: '$sippets.ref_sippet.author',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $set: {
          followed: true
        }
      },
      {
        $project: {
          _id: '$sippets._id',
          is: '$sippets.is',
          author: {
            _id: '$sippets.author._id',
            username: '$sippets.author.username',
            image: 1,
          },
          blocks: '$sippets.blocks',
          language: '$sippets.language',
          ref_sippet: {
            _id: '$sippets.ref_sippet._id',
            author: {
              _id: '$sippets.ref_sippet.author._id',
              username: '$sippets.ref_sippet.author.username',
              image: 1,
            },
            blocks: '$sippets.ref_sippet.blocks',
            language: '$sippets.ref_sippet.language',
            likesCount: '$sippets.ref_sippet.likesCount',
            commentsCount: '$sippets.ref_sippet.commentsCount',
            toastsCount: '$sippets.ref_sippet.toastsCount',
            hashtags: '$sippets.ref_sippet.hashtags',
            createdAt: 1
          },
          file: 1,
          likesCount: '$sippets.likesCount',
          commentsCount: '$sippets.commentsCount',
          toastsCount: '$sippets.toastsCount',
          hashtags: '$sippets.hashtags',
          createdAt: '$sippets.createdAt',
          followed: 1,
          liked: 1,
        },
      },
    ]).exec();

    const finalSippets = sippets.map(s => {
      const liked = s.liked ? true : false;
      return {
        ...s,
        liked
      }
    })
    
    res.status(200).json(finalSippets)
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ message: 'Failed to fetch sippets' })
  }
}

module.exports = {
  postSippet,
  deleteSippet,
  updateSippet,
  likeSippet,
  toastSippet,
  postComment,
  getSingleSippet,
  getLatestSippets,
  getFollowingSippets,
  getLikedSippets,
};
