const mongoose = require('mongoose');
const Sippet = require('../../models/sippetModel');
const { ObjectId } = mongoose.Types

const Like = require('../../models/likeModel');

const getSingleSippet = async (req, res) => {
  const { id: sippetId } = req.params;
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
          likesCount: 1,
          commentsCount: 1,
          toastsCount: 1,
          hashtags: 1,
          comments: 1,
          commentAuthors: 1,
        }
      }
    ]).exec();
    
    sippet.comments = sippet.comments.map(comment => {

      const [author] = sippet.commentAuthors.filter(a => {
        if (a._id.toString() == comment.author.toString())
          return { id: a._id, username: a.username, image: a.image }
      })

      return {
        ...comment,
        author,
      }
    })

    delete sippet.commentAuthors

    res.json(sippet)
    console.log(sippet);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: 'An error occurred while fetching the sippet.' });
  }  
};

const getLatestSippets = async (req, res) => {
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
          },
          file: 1,
          blocks: 1,
          language: 1,
          ref_sippet: 1,
          likesCount: 1,
          commentsCount: 1,
          toastsCount: 1,
          createdAt: 1,
          hashtags: 1,
        }
      }
    ]).exec();
    
    res.json(sippets)
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: 'An error occurred while fetching the sippets.' });
  }
};

const getUserComments = async (req, res) => {
  const { id: userId } = req.params
  const { offset } = req.query || 0

  try {
    const comments = await Sippet.aggregate([
      {
        $match: { $and: [
          { author: new ObjectId(userId) },
          { is: { $eq: 'comment' } }
        ]}
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
            _id: 1,
            username: 1,
            image: 1,
          },
          blocks: 1,
          language: 1,
          ref_sippet: {
            _id: 1,
            author: {
              _id: 1,
              username: 1,
              image: 1,
            },
            file: 1,
            blocks: 1,
            language: 1,
            likesCount: 1,
            commentsCount: 1,
            toastsCount: 1,
            hashtags: 1,
          },
          file: 1,
          likesCount: 1,
          commentsCount: 1,
          toastsCount: 1,
          hashtags: 1,
          createdAt: 1,
        },
      },
    ]).exec()
    res.status(200).json(comments)
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ message: "Couldn't fetch comments" })
  }
}

const getUserSippets = async (req, res) => {
  const { id: userId } = req.params
  const { offset } = req.query || 0

  try {
    const sippets = await Sippet.aggregate([
      {
        $match: { $and: [
          { author: new ObjectId(userId) },
          { is: { $ne: 'comment' } }
        ]}
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
            _id: 1,
            username: 1,
            image: 1,
          },
          blocks: 1,
          language: 1,
          ref_sippet: {
            _id: 1,
            author: {
              _id: 1,
              username: 1,
              image: 1,
            },
            file: 1,
            blocks: 1,
            language: 1,
            likesCount: 1,
            commentsCount: 1,
            toastsCount: 1,
            hashtags: 1,
          },
          file: 1,
          likesCount: 1,
          commentsCount: 1,
          toastsCount: 1,
          hashtags: 1,
          createdAt: 1,
        },
      },
    ]).exec()
    res.status(200).json(sippets)
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ message: "Couldn't fetch sippets" })
  }
}

module.exports = {
  getSingleSippet,
  getUserSippets,
  getLatestSippets,
  getUserComments,
};
