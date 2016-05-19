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
      DaydStatsReferer.update({referer: this.connection.headers.referer}, {$inc: {count: +1}}, {upsert: true});
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

  statsNotFilteredGroupedPathCount: function(custPaths) {
    return DaydStatsPath.aggregate([{$match: {path: {$in: custPaths}}}, {
      $group: {
        _id: "$path",
        count: {$sum: 1}
      }
    }, {$sort: {count: -1}}, {$limit: 5}]);
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
    var date = new Date();
    var docInDb = DaydStatsUsers.findOne({userId: userId}, {sort: {createdAt: -1}});
    return DaydStatsUsers.update({_id: docInDb._id}, {
      $set: {"finishedAt": date}
    });
  },

  statsUsersCount: function(distinct) {
    if(distinct) {
      return DaydStatsUsers.aggregate([{
        $group: {
          _id: "$userEmail",
          count: {$sum: 1}
        }
      }, {$sort: {count: -1}}])
    } else {
      return DaydStatsUsers.find().count();
    }
  },

  getStatsDurationConnectionAverage: function() {
    DaydStatsUsers.aggregate([{
      $project: {
        userEmail: 1,
        userId: 1,
        connectionDuration: {$subtract: ["$finishedAt", "$startedAt"]}
      }
    },
      {$out: "dayd_stats_output"}
    ]);
    return DaydStatsOutput.aggregate([{
      $group: {
        _id: "$userEmail",
        avgConnectionDuration: {$avg: "$connectionDuration"}
      }
    }, {$sort: {avgConnectionDuration: -1}}]);
  },

  getPathsPerUserConnection: function() {
    return DaydStatsPath.aggregate([{
      $match: {connection_id: {$ne: "root"}}
    },
      {
        $group: {
          _id: "$connection_id",
          pages: {$sum: 1}
        }
      },
      {$sort: {pages: -1}}
    ]);
  },

  getDurationConnectionPaths: function(customPaths) {
    return DaydStatsPath.aggregate([
      {$match: {path: {$in: customPaths}}},
      {
        $group: {
          _id: "$path",
          avgConnectionPaths: {$avg: {$subtract: ["$endedAt", "$createdAt"]}}
        }
      },
      {$sort: {avgConnectionPaths: -1}}
    ]);
  },

  getCustomStatsWithParameter: function(customName) {
    return DaydStatsCustom.aggregate([
      {$match: {customName: customName}},
      {
        $group: {
          _id: "$customDataName",
          count: {$sum: 1}
        }
      },
      {$sort: {count: -1}},
      {$limit: 10}
    ]);
  },

  getCustomStatsCountWithParameter: function(customName) {
    return DaydStatsCustom.find({customName: customName}).count();
  },

  getStatsUsersConnectedInRealTime: function() {
    return DaydStatsUsers.aggregate([
      {$match: {"finishedAt": {'$exists': false}}},
      {$group: {_id: "$userEmail", count: {$sum: 1}}},
      {$sort: {count: -1}}
    ]);
  },

  getStatsUsersLastConnection: function(userId) {
    var lastUserConnection = DaydStatsUsers.findOne({userId: userId}, {sort: {createdAt: -1}});
    if(lastUserConnection)
      return lastUserConnection.createdAt;
  }
});


