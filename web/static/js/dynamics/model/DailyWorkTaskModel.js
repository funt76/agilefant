var TaskModelExtender = function() {};
TaskModelExtender.prototype = new TaskModel();
DailyWorkTaskModel = function DailyWorkTaskModel() {
    TaskModel.call(this);
    
    this.initialize();
    this.persistedClassName = "fi.hut.soberit.agilefant.transfer.DailyWorkTaskTO";

    this.relations = {
      backlog: null,
      story: null,
      dailyWork: null,
      user: [],
      hourEntry: []
    };

    this.copiedFields = {
      "name":               "name",
      "state":              "state",
      "description":        "description",
      "effortLeft":         "effortLeft",
      "originalEstimate":   "originalEstimate",
      "rank":               "rank",
      "taskClass":          "taskClass",
      "workQueueRank":      "workQueueRank",
      "parentStoryId":      "parentStoryId",
      "backlogId":          "backlogId",
      "contextName":        "contextName"
    };

    this.classNameToRelation = {
      "fi.hut.soberit.agilefant.model.Iteration":     "backlog",
      "fi.hut.soberit.agilefant.model.User":          "user",
      "fi.hut.soberit.agilefant.model.Story":         "story",
      "fi.hut.soberit.agilefant.model.DailyWork":     "dailyWork",
      "fi.hut.soberit.agilefant.model.HourEntry":     "hourEntry"
    };
    
    this.transientData.workingOnTaskIds = [];
};

DailyWorkTaskModel.prototype = new TaskModelExtender();

DailyWorkTaskModel.prototype.getTaskClass = function() {
    return this.currentData.taskClass;
};

DailyWorkTaskModel.prototype.getDailyWork = function() {
    return this.relations.dailyWork;
};

DailyWorkTaskModel.prototype.setDailyWork = function(dailyWork) {
    this.addRelation(dailyWork);
};

DailyWorkTaskModel.prototype.getWorkQueueRank = function() {
    return this.currentData.workQueueRank;
};

DailyWorkTaskModel.prototype.getContext = function() {
    if (this.relations.backlog) {
        return {
            name: this.relations.backlog.getName(),
            storyId: 0,
            backlogId: this.relations.backlog.getId(),
            taskId: this.getId()
        };
    }
    
    return {
        name: this.currentData.contextName,
        storyId: this.currentData.parentStoryId,
        backlogId: this.currentData.backlogId,
        taskId: this.getId()
    };
};

DailyWorkTaskModel.prototype.setContextFromContextObject = function(context) {
    this.currentData.contextName   = context.name;
    this.currentData.parentStoryId = context.parentStoryId;
    this.currentData.backlogId     = context.backlogId;
};

DailyWorkTaskModel.prototype.rankDailyUnder = function(rankUnderId, moveUnder) {
    var me = this;

    if (moveUnder && moveUnder !== me.getDailyWork()) {
        MessageDisplay.Error("An UI error occured while ranking the task in the queue.");
        return;
    }

    var data = {
        taskId:      me.getId(),
        rankUnderId: rankUnderId,
        userId:      me.getDailyWork().getUser().getId()
    };

    jQuery.ajax({
        url: "ajax/rankDailyTaskAndMoveUnder.action",
        type: "post",
        dataType: "text",
        data: data,
        success: function(data, status) {
            MessageDisplay.Ok("Task ordered successfully.");
            var oldParent = me.getDailyWork();
            // me.setData(data);
            oldParent.reload();
            if (oldParent !== moveUnder) {
                moveUnder.reload();
            }

            me.getDailyWork().reload();
        },
        error: function(xhr, status) {
            MessageDisplay.Error("An error occured while ranking the task in queue.", xhr);
        }
    });
};

DailyWorkTaskModel.prototype.removeFromDailyWork = function(successCallback) {
    var me = this;
    jQuery.ajax({
        type: "POST",
        url: "ajax/deleteFromWorkQueue.action",
        async: true,
        cache: false,
        dataType: "text",
        data: {
            taskId: me.getId(),
            userId: me.getDailyWork().getUser().getId()
        },
        success: function(data,status) {
          MessageDisplay.Ok("Task removed from work queue");
          me.getDailyWork().reload();
        },
        error: function(xhr,status) {
          MessageDisplay.Error("Error removing task from work queue.", xhr);
        }
    });

};
