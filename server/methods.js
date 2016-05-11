Meteor.methods({

  statsInsert: function(path, hasSession) {
    var ip = this.connection.httpHeaders['x-forwarded-for'] || this.connection.clientAddress;
    var exist = DaydStats.findOne({ip: ip});
    var date = new Date();

    if(exist) {
      var userId = null;
      if(this.userId)
        userId = this.userId;

      DaydStatsPath.insert({path: path, source_id: exist._id, createdAt: date});

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
      DaydStatsPath.insert({path: path, source_id: lastInsert, createdAt: new Date()});
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

  statsNotFilteredGroupedPathCount: function(custPaths) {
    return DaydStatsPath.aggregate([
      {
        $match: {path: {$in: custPaths}}
      },
      {
        $group: {
          _id: "$path",
          count: {$sum: 1}
        }
      },
      {
        $sort: {
          count: -1
        }
      },
      {
        $limit:5
      }
    ]);
  },
  statsUserInsert: function(username, userEmail){
    var ip = this.connection.httpHeaders['x-forwarded-for'] || this.connection.clientAddress;
    var date = new Date();
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
    if(username)
      stats.username = username;
    if(userEmail)
      stats.userEmail = userEmail;
    return DaydStatsUsers.insert(stats);
  }

});
