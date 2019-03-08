/**
 * @overview ccm component for creating a player
 * @author Arthur Zimmermann 2018
 * @license MIT License
 * @version 1.0.0
 * @changes
 * version 1.0.0 (20.01.2019)
 */

(function () {

    const component = {

        name: "storyboard",

        ccm: "https://ccmjs.github.io/ccm/ccm.js",

        config: {
            "html": {
                "storyboard": {
                    "tag": "div",
                    "class": "storyboard",
                    "inner": [],
                }
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
                const svgPic = document.createElementNS("http://www.w3.org/2000/svg", "svg");
                const storyboard = this.element.querySelector(".storyboard");
                svgPic.setAttribute("width", "100%");
                svgPic.setAttribute("height", "100%");
                await storyboard.appendChild(svgPic);
                await this.renderMilestones();
                await this.renderTasks();

            };
            this.renderMilestones = async () => {
                await this.store.get("game")
                    .then(result => {
                        this.player = result.value;
                    });
                const numberOfMilestones = this.milestones.length;
                let pathCoordinates = [];
                const storyboard = this.element.querySelector("svg");
                const svgBound = storyboard.getBoundingClientRect();
                const addwidth = svgBound.width / numberOfMilestones;
                let startX = addwidth / 2;
                const startY = svgBound.height / 2;
                pathCoordinates.push({X: startX, Y: startY});

                this.milestones.forEach((milestone, index) => {
                    const milestoneCircle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
                    milestoneCircle.setAttribute("fill", "gray");
                    milestoneCircle.setAttribute("stroke", "0");
                    milestoneCircle.setAttribute("r", "50");
                    milestoneCircle.id = milestone.milestoneID;

                    const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
                    text.setAttribute("font-size", "30");
                    text.setAttribute("font-family", "sans-serif");
                    text.setAttribute("fill", "black");
                    text.setAttribute("text-anchor", "middle");


                    if (milestone.conditions.level <= this.player.level) {
                        milestoneCircle.setAttribute("fill", "black");
                        milestone.show = true;
                    }

                    if (index === 0) {
                        milestoneCircle.setAttribute("cx", "" + startX);
                        milestoneCircle.setAttribute("cy", "" + startY);

                        text.setAttribute("x", "" + startX);
                        text.setAttribute("y", "" + (startY + 80));
                        text.innerHTML = "Start";
                        storyboard.appendChild(text);
                    }
                    else if (index % 2 === 0 && index !== numberOfMilestones - 1) {
                        milestoneCircle.setAttribute("cx", "" + startX);
                        milestoneCircle.setAttribute("cy", "" + startY / 2);
                        pathCoordinates.push({X: startX, Y: startY / 2});

                    }
                    else if (index % 2 === 1 && index !== 0) {
                        milestoneCircle.setAttribute("cx", "" + startX);
                        milestoneCircle.setAttribute("cy", "" + startY * 1.50);
                        pathCoordinates.push({X: startX, Y: startY * 1.50});

                    }
                    else if (index === numberOfMilestones - 1) {
                        milestoneCircle.setAttribute("cx", "" + startX);
                        milestoneCircle.setAttribute("cy", "" + startY);
                        pathCoordinates.push({X: startX, Y: startY});

                        text.setAttribute("x", "" + startX);
                        text.setAttribute("y", "" + (startY + 80));
                        text.innerHTML = "Ziel";
                        storyboard.appendChild(text);
                    }
                    storyboard.appendChild(milestoneCircle);
                    startX += addwidth
                });
                storyboard.appendChild(this.drawPath(pathCoordinates));
            };
            this.drawPath = (coordinates) => {
                const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
                let pathString = "";
                coordinates.forEach((item, index) => {
                    if (index === 0) {
                        pathString += "M" + item.X + " " + item.Y + " ";
                    }
                    else {
                        pathString += "L" + item.X + " " + item.Y + " ";
                    }
                });
                path.setAttribute("d", pathString);
                path.setAttribute("stroke", "black");
                path.setAttribute("stroke-width", "5");
                path.setAttribute("fill", "none");
                return path;
            };

            this.renderTasks = () => {
                const storyboard = this.element.querySelector("svg");
                /*y is a mutable variable that is adding the y coordinate based on the height*/
                let y = 0;
                /* tmp variable to store which milestone is now looked at */
                let tmp = "";
                this.tasks.forEach((task, index) => {
                    console.log(task.taskDone);
                    /* Setting the y coordinate to 0 when new milestone is in the task*/
                    if (tmp !== task.milestoneId) {
                        y = 0;
                    }
                    tmp = task.milestoneId;
                    const taskTag = document.createElementNS("http://www.w3.org/2000/svg", "rect");
                    const milestoneWrapper = this.element.querySelector("#" + task.milestoneId);

                    taskTag.id = task.taskId;
                    taskTag.setAttribute("height", "20px");
                    taskTag.setAttribute("width", "20px");

                    if (index % 2 === 0) {
                        taskTag.setAttribute("x", "" + (milestoneWrapper.getBoundingClientRect().x - 30));
                        taskTag.setAttribute("y", "" + (y += 30));
                    }
                    else if (index % 2 === 1) {
                        taskTag.setAttribute("x", "" + (milestoneWrapper.getBoundingClientRect().x + milestoneWrapper.getBoundingClientRect().width - 10));
                        taskTag.setAttribute("y", "" + (y += 30));
                    }
                    if (task.challenge) {
                        taskTag.setAttribute("fill", "red");
                    }
                    else {
                        taskTag.setAttribute("fill", "green");
                    }
                    taskTag.addEventListener("click", () => this.renderTaskField(task));
                    taskTag.innerHTML = task.task.title;

                    const result = this.milestones.find(milestone => milestone.milestoneID === task.milestoneId);
                    if (result.show === true) {
                        storyboard.appendChild(taskTag);
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

                const testButton = document.createElement("button");
                testButton.innerHTML = "Test Aufgaben button";
                if (task.task.task === "test") {
                    testButton.addEventListener("click", async () => {
                        if (!task.taskDone) {
                            await this.parent.playerStatus.setProgress(task.exp);
                            if (task.reward) {
                                this.parent.playerStatus.badges.addBadge(task.reward);
                                task.taskDone = true;
                                tasksDone.push(task);
                                this.store.set({"key": "tasksdone", "value": tasksDone});
                            }
                        }
                    });
                }

                console.log(task.task.task);
                task.task.task.onfinish=()=>console.log("Done");
                task.task.task.start();
                taskField.appendChild(task.task.task.root);
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