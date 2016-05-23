Meteor.methods({

  statsInsert: function(path, hasSession) {
    var ip = this.connection.httpHeaders['x-forwarded-for'] || this.connection.clientAddress;
    var exist = DaydStats.findOne({ip: ip});
    var date = new Date();
    var currentStatsUsers = DaydStatsUsers.findOne({userId: this.userId}, {sort: {createdAt: -1}});
    if(currentStatsUsers && currentStatsUsers._id) {
      connectionId = currentStatsUsers._id;
    } else {
      connectionId = "root";
    }


    if(exist && currentStatsUsers) {
      var userId = null;
      if(this.userId) userId = this.userId;
      var lastPathDoc = DaydStatsPath.findOne({source_id: exist._id}, {sort: {createdAt: -1}});
      if(lastPathDoc)
        DaydStatsPath.update({_id: lastPathDoc._id}, {$set: {endedAt: date}});
      DaydStatsPath.insert({
        path: path,
        source_id: exist._id,
        connection_id: connectionId,
        userId: userId,
        createdAt: date
      });
      DaydStats.update(exist._id, {
        $set: {"userId": userId, modifiedAt: date}
      });
      return exist._id;
    }
    else {
      var stats = {
        ip: ip,
        connectionId: this.connection.id,
        connection: this.connection,
        headers: this.connection.headers,
        modifiedAt: date,
        createdAt: date
      };

      if(this.userId)
        stats.userId = this.userId;

      var lastInsert = DaydStats.insert(stats);
      var lastPathDoc = DaydStatsPath.findOne({source_id: exist._id}, {sort: {createdAt: -1}});
      if(lastPathDoc)
        DaydStatsPath.update({_id: lastPathDoc._id}, {$set: {endedAt: date}});
      DaydStatsPath.insert({
        path: path,
        source_id: lastInsert,
        connection_id: connectionId,
        userId: stats.userId,
        createdAt: new Date()
      });
      if(this.connection && this.connection.headers) DaydStatsReferer.update({referer: this.connection.headers.referer}, {$inc: {count: +1}}, {upsert: true});
      return lastInsert;
    }

  },

  statsRemove: function(id) {
    DaydStatsPath.remove({source_id: id});
    return DaydStats.remove(id);
  },

  statsAsRobot: function(id, isRobot) {
    return DaydStats.update(id, {
      $set: {"isRobot": isRobot}
    });

  },

  statsCustomInsert: function(customName, customId, customDataName) {
    if(!this.userId || !customName || !customId) return;

    var customData = {
      customName: customName,
      customId: customId,
      createdAt: new Date(),
      userId: this.userId
    };

    if(customDataName) customData.customDataName = customDataName;
    return DaydStatsCustom.insert(customData);
  },

  statsNotFilteredGroupedPathCount: function(custPaths, userIds, all, hide) {
    if(custPaths && userIds && all && hide) {
      return DaydStatsPath.aggregate([{
        "$match": {
          "path": {"$in": custPaths},
          "userId": {"$in": userIds, $nin: hide}
        }
      }, {
        $group: {
          _id: "$path",
          count: {$sum: 1}
        }
      }, {$sort: {count: -1}}, {$limit: 3}]);
    } else {
      return DaydStatsPath.aggregate([{"$match": {"path": {"$in": custPaths}, "userId": {"$nin": hide}}}, {
        $group: {
          _id: "$path",
          count: {$sum: 1}
        }
      }, {$sort: {count: -1}}, {$limit: 3}]);
    }

  },

  statsUserInsert: function(username, userEmail) {
    var ip = this.connection.httpHeaders['x-forwarded-for'] || this.connection.clientAddress;
    var date = new Date();
    var stats = {
      ip: ip,
      connectionId: this.connection.id,
      connection: this.connection,
      headers: this.connection.headers,
      startedAt: date,
      createdAt: date
    };
    if(this.userId)
      stats.userId = this.userId;
    if(username)
      stats.username = username;
    if(userEmail)
      stats.userEmail = userEmail;
    //return DaydStatsUsers.insert(stats);
    var isInDb = DaydStatsUsers.findOne({username: username}, {sort: {createdAt: -1}});
    if(!isInDb) {
      return DaydStatsUsers.insert(stats);
    } else if(isInDb && !isInDb.finishedAt) {
      return true;
    } else if(isInDb && isInDb.finishedAt) {
      return DaydStatsUsers.insert(stats);
    }
  },

  statsUserUpdate: function(userId) {
    if(!userId) return console.log('Calling statsUserUpdate with no parameter');
    var date = new Date();
    var docInDb = DaydStatsUsers.findOne({userId: userId}, {sort: {createdAt: -1}});
    if(!docInDb) return console.log('Calling statsUserUpdate: user not found');
    return DaydStatsUsers.update({_id: docInDb._id}, {
      $set: {"finishedAt": date}
    });
  },

  statsUsersDistinct: function(distinct, hide) {
    if(distinct && hide) {
      return DaydStatsUsers.aggregate([
        {$match: {userId: {$nin: hide}}},
        {
          $group: {
            _id: "$userEmail",
            count: {$sum: 1}
          }
        }, {$sort: {count: -1}}])
    }
  },
  statsUsersCount: function(hide) {
    return DaydStatsUsers.find({userId: {$nin: hide}}).count();
  }
  ,

  getStatsDurationConnectionAverage: function(userIds, all, hide) {
    DaydStatsUsers.aggregate([{
      $project: {
        userEmail: 1,
        userId: 1,
        connectionDuration: {$subtract: ["$finishedAt", "$startedAt"]}
      }
    },
      {$out: "dayd_stats_output"}
    ]);
    if(userIds && all && hide) {
      return DaydStatsOutput.aggregate([
        {$match: {userId: {$in: userIds, $nin: hide}}},
        {
          $group: {
            _id: "$userEmail",
            avgConnectionDuration: {$avg: "$connectionDuration"}
          }
        }, {$sort: {avgConnectionDuration: -1}}]);
    } else {
      return DaydStatsOutput.aggregate([
        {$match: {userId: {$nin: hide}}},
        {
          $group: {
            _id: "$userEmail",
            avgConnectionDuration: {$avg: "$connectionDuration"}
          }
        }, {$sort: {avgConnectionDuration: -1}}]);
    }
  },

  getPathsPerUserConnection: function(userIds, all, hide) {
    if(userIds && all && hide) {
      return DaydStatsPath.aggregate([{$match: {userId: {$in: userIds, $nin: hide}, connection_id: {$ne: "root"}}},
        {$group: {"_id": {"connex": "$connection_id", "userId": "$userId"}, "pagesViewed": {$sum: 1}}},
        {$group: {"_id": "$_id.userId", "avgPagesViewed": {$avg: "$pagesViewed"}}},
        {$sort: {avgPagesViewed: -1}}
      ]);
    } else {
      return DaydStatsPath.aggregate([{$match: {userId: {'$exists': true, $nin: hide}, connection_id: {$ne: "root"}}},
        {$group: {"_id": {"connex": "$connection_id", "userId": "$userId"}, "pagesViewed": {$sum: 1}}},
        {$group: {"_id": "$_id.userId", "avgPagesViewed": {$avg: "$pagesViewed"}}},
        {$sort: {avgPagesViewed: -1}}
      ]);
    }

  },

  getDurationConnectionPaths: function(customPaths, userIds, all, hide, date) {
    var start = new Date(date.start);
    var end = new Date(date.end);
    if(customPaths && userIds && all && hide && !Object.keys(date).length) {
      return DaydStatsPath.aggregate([
        {$match: {path: {$in: customPaths}, userId: {$in: userIds, $nin: hide}}},
        {
          $group: {
            _id: "$path",
            avgConnectionPaths: {$avg: {$subtract: ["$endedAt", "$createdAt"]}}
          }
        },
        {$sort: {avgConnectionPaths: -1}}
      ]);
    } else if(customPaths && userIds && all && hide && Object.keys(date).length){
      return DaydStatsPath.aggregate([
        {$match: {path: {$in: customPaths}, userId: {$in: userIds, $nin: hide}, createdAt: {$gte: start, $lt: end }}},
        {
          $group: {
            _id: "$path",
            avgConnectionPaths: {$avg: {$subtract: ["$endedAt", "$createdAt"]}}
          }
        },
        {$sort: {avgConnectionPaths: -1}}
      ]);
    } else if(customPaths && !all && hide && Object.keys(date).length){
      return DaydStatsPath.aggregate([
        {$match: {path: {$in: customPaths}, userId: { $nin: hide}, createdAt: {$gte: start, $lt: end }}},
        {
          $group: {
            _id: "$path",
            avgConnectionPaths: {$avg: {$subtract: ["$endedAt", "$createdAt"]}}
          }
        },
        {$sort: {avgConnectionPaths: -1}}
      ]);
    } else {
      return DaydStatsPath.aggregate([
        {$match: {path: {$in: customPaths}, userId: {$nin: hide}}},
        {
          $group: {
            _id: "$path",
            avgConnectionPaths: {$avg: {$subtract: ["$endedAt", "$createdAt"]}}
          }
        },
        {$sort: {avgConnectionPaths: -1}}
      ]);
    }
  },

  getCustomStatsWithParameter: function(customName, userIds, all, hide) {
    if(customName && userIds && all && hide) {
      return DaydStatsCustom.aggregate([
        {$match: {customName: customName, userId: {$in: userIds, $nin: hide}, customDataName: {'$exists': true}}},
        {
          $group: {
            _id: "$customDataName",
            count: {$sum: 1}
          }
        },
        {$sort: {count: -1}},
        {$limit: 10}
      ]);
    } else {
      return DaydStatsCustom.aggregate([
        {$match: {customName: customName, customDataName: {'$exists': true}, userId: {$nin: hide}}},
        {
          $group: {
            _id: "$customDataName",
            count: {$sum: 1}
          }
        },
        {$sort: {count: -1}},
        {$limit: 10}
      ]);
    }
  },

  getCustomStatsCountWithParameter: function(customName, userIds, all, hide) {
    if(customName && userIds && all && hide) {
      return DaydStatsCustom.find({
        customName: customName,
        userId: {$in: userIds, $nin: hide},
        customDataName: {'$exists': true}
      }).count();
    } else {
      return DaydStatsCustom.find({
        "customName": customName,
        "customDataName": {'$exists': true},
        'userId': {$nin: hide}
      }).count();
    }
  },

  getStatsUsersConnectedInRealTime: function(hide) {
    return DaydStatsUsers.aggregate([
      {$match: {"finishedAt": {'$exists': false}, "userId": {"$nin": hide}}},
      {$group: {_id: "$userEmail", count: {$sum: 1}}},
      {$sort: {count: -1}}
    ]);
  },

  getStatsUsersLastConnection: function(userIds) {
    if(userIds) {
      return DaydStatsUsers.aggregate([
        {$match: {userId: {$in: userIds}}},
        {$sort: {createdAt: -1}},
        {$group: {"_id": "$userId", date: {$first: "$createdAt"}}},
        {$sort: {'date': -1}}
      ]);
    } else {
      return DaydStatsUsers.aggregate([
        {$sort: {createdAt: -1}},
        {$group: {"_id": "$userId", date: {$first: "$createdAt"}}}
      ]);
    }
  },

  getNumberStatsVisitsPerUser: function(userIds) {
    return DaydStatsUsers.aggregate([
      {$match: {'userId': {$in: userIds}}},
      {$group: {_id: "$userEmail", count: {$sum: 1}}},
      {$sort: {'date': -1}}
    ]);
  }
});


