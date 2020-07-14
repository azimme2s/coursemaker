/**
 * @overview ccm component for creating al storyboard as a playboard
 * @author Arthur Zimmermann 2018
 * @license MIT License
 * @version 1.0.0
 * @changes
 * version 1.0.0 (20.01.2019)
 */

(function () {

    const component = {

        name: "storyboard",

        ccm: "https://ccmjs.github.io/ccm/versions/ccm-20.1.0.js",

        config: {
            "html": {
                "storyboard":[
                    {
                        "tag":"div",
                        "class":"legend",
                        "inner": {
                            "tag": "h2",
                            "class": "legend-headline",
                            "inner": "Legende zu den Aufgaben"
                        }
                    },
                    {
                        "tag": "div",
                        "class": "storyboard",
                        "inner": {
                            "tag": "ul",
                            "class": "timeline",
                            "inner": []
                        }
                    },
                    {
                        "tag": "div",
                        "class": "taskfield",
                        "inner": []
                    }
                ]
            },
            "css": ["ccm.load", "../storyboard/resources/default.css"],
            "store": ["ccm.store", {"name": "player"}]
        },

        Instance: function () {
            let tasksDone = [];
            this.start = async () => {
                await this.store.get("tasksdone").then(result => {
                    tasksDone = result.value;
                    this.tasks.forEach(element => {
                        result.value.forEach(e => {
                            if (e.taskId === element.taskId) {
                                element.taskDone = e.taskDone;
                            }
                        })
                    })
                }).catch(error => {
                    this.store.set({"key": "tasksdone", "value": []});
                });
                this.ccm.helper.setContent(this.element, this.ccm.helper.html(this.html.storyboard));
                const legendWrapper = this.element.querySelector(".legend");
                this.legend.forEach(element => {
                    const taskLegendIcon =  document.createElement("div");
                    taskLegendIcon.className = "legends-icon"
                    taskLegendIcon.style.backgroundColor = element.color;


                    const taskLegendTitle =  document.createElement("span");
                    taskLegendTitle.className = "legends-title"
                    taskLegendTitle.innerHTML = element.difficulty;

                    legendWrapper.appendChild(taskLegendIcon);
                    legendWrapper.appendChild(taskLegendTitle);
                });
                await this.renderMilestones();
                await this.renderTasks();

            };
            this.renderMilestones = async () => {
                const timeline = this.element.querySelector(".timeline");
                await this.store.get("game")
                    .then(result => {
                        this.player = result.value;
                    });
                await this.store.get("tasksdone")
                    .then(result => {
                        this.taskdone = result.value;
                    });

                this.milestones.forEach((milestone, index) => {
                    const milestoneElement = document.createElement("li")
                    if (milestone.conditions.level <= this.player.level && this.checkDoneTasks(milestone.conditions.tasksDone, this.taskdone)) {
                        milestoneElement.className = 'event';
                        milestone.show = true;
                        timeline.style.borderLeftColor = '#a6afc1';
                    }
                    milestoneElement.className = 'event-grey';
                    if (index === 0) {
                        milestoneElement.setAttribute('data-date', 'Start')
                    }
                    else if( index === this.milestones.length - 1) {
                        milestoneElement.setAttribute('data-date', 'Ziel')
                    }
                    else {
                        milestoneElement.setAttribute('data-date', `Meilenstein${index+1}`)
                    }
                    const taskContainer = document.createElement("div");
                    taskContainer.className = 'task-container';
                    taskContainer.id = milestone.milestoneID;
                    milestoneElement.appendChild(taskContainer);

                    timeline.appendChild(milestoneElement);
                });
            };

            this.checkDoneTasks = (_arr1, _arr2) => {

                if (!Array.isArray(_arr1) || !Array.isArray(_arr2))
                    return false;

                if (_arr1.length === 0){
                    return true;
                }
                let arr1 = _arr1.concat().sort();
                let arr2 = _arr2.concat().sort();

                for (let i = 0; i < arr1.length; i++) {

                    if (arr1[i].taskId !== arr2[i].taskId)
                        return false;

                }

                return true;

            };

            this.renderTasks = () => {

                this.tasks.forEach((task, index) => {
                    const taskTag = document.createElement("div");
                    const milestoneWrapper = this.element.querySelector("#" + task.milestoneId);

                    taskTag.id = task.taskId;
                    taskTag.className = 'task';
                    taskTag.tabIndex = 0;
                    taskTag.style.backgroundColor = task.color;

                    taskTag.addEventListener("click", () => this.renderTaskField(task));
                    taskTag.innerHTML = task.task.title;
                    const result = this.milestones.find(milestone => milestone.milestoneID === task.milestoneId);
                    if (result.show === true) {
                        milestoneWrapper.appendChild(taskTag);
                    }


                })
            };
            this.renderTaskField = (task) => {
                let oldTask = this.element.querySelectorAll(".taskfield");
                oldTask.forEach(element => {
                    element.parentNode.removeChild(element);
                });
                const taskField = document.createElement("div");
                taskField.className = "taskfield";

                const taskTitle = document.createElement("h2");
                taskTitle.className = "tasktitle";
                taskTitle.innerHTML = task.task.title;
                taskField.appendChild(taskTitle);

                const testButton = document.createElement("button");
                testButton.innerHTML = "Test Aufgaben button";
                if (task.task.task === "test") {
                    testButton.addEventListener("click", () => {
                        if (!task.taskDone) {
                            this.parent.setProgress(task.exp).then(result => {
                                this.parent.comparegame.addGame(result);
                                if (task.reward) {
                                    this.parent.badges.addBadge(task.reward);
                                }
                                task.taskDone = true;
                                tasksDone.push(task);
                                this.store.set({"key": "tasksdone", "value": tasksDone});
                                this.parent.comparegame.addTasksdone(task);
                            });
                        }
                    });
                    taskField.appendChild(testButton);
                } else {
                    task.task.task.onfinish = currentTask => {
                        if(currentTask.getValue().correct >= task.task.correct){
                            if (!task.taskDone) {
                                this.parent.setProgress(task.exp).then(result => {
                                    this.parent.comparegame.addGame(result);
                                    if (task.reward) {
                                        this.parent.badges.addBadge(task.reward);
                                    }
                                    task.taskDone = true;
                                    tasksDone.push(task);
                                    this.store.set({"key": "tasksdone", "value": tasksDone});
                                    this.parent.comparegame.addTasksdone(task);
                                });
                            }
                        }
                    };
                    task.task.task.start();
                    taskField.appendChild(task.task.task.root);
                }
                this.element.appendChild(taskField);
            }

        }

    };

    let b = "ccm." + component.name + (component.version ? "-" + component.version.join(".") : "") + ".js";
    if (window.ccm && null === window.ccm.files[b]) return window.ccm.files[b] = component;
    (b = window.ccm && window.ccm.components[component.name]) && b.ccm && (component.ccm = b.ccm);
    "string" === typeof component.ccm && (component.ccm = {url: component.ccm});
    let c = (component.ccm.url.match(/(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)/) || ["latest"])[0];
    if (window.ccm && window.ccm[c]) window.ccm[c].component(component); else {
        var a = document.createElement("script");
        document.head.appendChild(a);
        component.ccm.integrity && a.setAttribute("integrity", component.ccm.integrity);
        component.ccm.crossorigin && a.setAttribute("crossorigin", component.ccm.crossorigin);
        a.onload = function () {
            window.ccm[c].component(component);
            document.head.removeChild(a)
        };
        a.src = component.ccm.url
    }
})();