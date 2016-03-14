/*global opensap*/

sap.ui.require([
    "sap/ui/test/Opa",
    "sap/ui/test/Opa5",
    "sap/ui/test/actions/Press",
	"sap/ui/test/matchers/AggregationFilled",
	"sap/ui/test/matchers/PropertyStrictEquals",
	"sap/ui/test/matchers/Properties",
	"sap/ui/test/matchers/Ancestor",
    "sap/m/MessageBox"
],
function (Opa, Opa5, Press, AggregationFilled, PropertyStrictEquals, Properties, Ancestor, MessageBox) {
    "use strict";

    // reduce global timeout to 5s
    Opa.config.timeout = 5;

    sap.ui.base.Object.extend("opensap.validator", {
        init: function () {
            this.injectTestButton();
            this.bindTestKey();
        },

        /**** Helper functions ***/

        // injects a simple testing button in the lower left area of the current app
        injectTestButton: function () {
            this._oValidateButton = new sap.m.Button("validate", {
                icon: "sap-icon://wrench",
                tooltip: "Click here or press F9 to execute the tests for this exercise",
                press: function () {
                    this.runTests();
                }.bind(this)
            }).placeAt("content", -1);

            // TODO: put this in CSS file?
            this._oValidateButton.addEventDelegate({
                onAfterRendering: function (oEvent) {
                    var oButton = oEvent.srcControl;
                    oButton.$().css("position", "absolute");
                    oButton.$().css("z-index", "100000");
                    oButton.$().css("width", "100px");
                    oButton.$().css("height", "100px");
                    oButton.$().css("left", "50px");
                    oButton.$().css("bottom", "50px");
                    oButton.$().css("border-radius", "500px");

                    oButton.$("inner").css("width", "100px");
                    oButton.$("inner").css("height", "100px");
                    oButton.$("inner").css("border-radius", "100px");
                    oButton.$("inner").css("background", "#009de0");
                    oButton.$("inner").css("text-shadow", "0 1px 50px #ffffff");

                    oButton.$("img").css("color", "#eee");
                    oButton.$("img").css("width", "100px");
                    oButton.$("img").css("height", "100px");
                    oButton.$("img").css("line-height", "100px");
                    oButton.$("img").css("font-size", "35pt");
                    oButton.$("img").control(0).setColor("#eee");
                }
            });
        },

        // bind F9 globally to trigger the tests
        bindTestKey: function () {
            var fnKeyDown = function (oEvent) {
                if (oEvent.keyCode === 120) { // F9 key triggers tests
                    this.runTests();
                }
            }.bind(this);
            jQuery(window.document).bind("keydown", fnKeyDown);
        },

        // saves the current test unit to the cookies
        setUnitCookie: function(sKey) {
            document.cookie="unit=" + sKey;
        },

        // reads the current test unit from the cookies
        getUnitCookie: function() {
            var sCookieUnit = document.cookie.split(";").filter(function (sItem) {return sItem.split("=")[0].trim() === "unit";});
            if (sCookieUnit.length) {
                return sCookieUnit[0].split("=").pop();
            }
            return "";
        },

        // http://werxltd.com/wp/2010/05/13/javascript-implementation-of-javas-string-hashcode-method/
        createHash : function(s) {
            var hash = 0,
                strlen = s.length,
                i,
                c;
            if ( strlen === 0 ) {
                return hash;
            }
            for (i = 0; i < strlen; i++ ) {
                c = s.charCodeAt( i );
                hash = ((hash << 5) - hash) + c;
                hash = hash & hash; // Convert to 32bit integer
            }
            return hash;
        },


        rankTest : function (sTestName, sMessage, bStatus) {
            // base 64 encode all test results
            this._sResult = this.createHash(this._sResult + btoa(sTestName + sMessage + bStatus));
        },

        /**** Layout functions ***/

        // returns a lazy loaded instance of the result popover
        getPopover: function () {
            if (!this._oPopover) {
                var oModel = new sap.ui.model.json.JSONModel();
                var mData = {
                    "items": [
                        {
                            "key": "",
                            "text": "..."
                        },
                        {
                            "key": "w1u1",
                            "text": "Week 1 Unit 1"
                        },
                        {
                            "key": "w1u2",
                            "text": "Week 1 Unit 2"
                        },
                        {
                            "key": "w1u3",
                            "text": "Week 1 Unit 3"
                        },
                        {
                            "key": "w1u4",
                            "text": "Week 1 Unit 4"
                        },
                        {
                            "key": "w1u5",
                            "text": "Week 1 Unit 5"
                        },
                        {
                            "key": "w1u6",
                            "text": "Week 1 Unit 6"
                        },
                        {
                            "key": "w2u1",
                            "text": "Week 2 Unit 1"
                        },
                        {
                            "key": "w1opt",
                            "text": "Week 2 Bonus"
                        }
                    ]};
                oModel.setData(mData);
                var oItemTemplate = new sap.ui.core.Item({
                    key: "{key}",
                    text: "{text}"
                });

                var oSelect = new sap.m.Select({
                    width: "200px",
                    selectedKey: this.getUnitCookie(),
                    items: {
                        path: "/items",
                        template: oItemTemplate
                    },
                    change: function(oControlEvent) {
                        var oSelectedItem = oControlEvent.getParameter("selectedItem");

                        if (oSelectedItem) {
                            this.runTests(oSelectedItem.getKey());
                            jQuery.sap.log.info("Event fired: 'change' value to " + oSelectedItem.getText() + " on " + this);
                        }
                    }.bind(this)
                });
                oSelect.setModel(oModel);

                this._oPopover = new sap.m.Popover("validatePopover", {
                    customHeader: new sap.m.Bar({
                        contentMiddle: [
                            new sap.m.Text({text: "Validating..."}).addEventDelegate({
                                onAfterRendering: function (oEvent) {
                                    var $Control = oEvent.srcControl.$();
                                    $Control.css("font-size", "1.125rem");
                                }
                            }).addStyleClass("sapUiSmallMarginBeginEnd"),
                            oSelect
                        ]
                    }),
                    initialFocus: oSelect,
                    content: [
                        new sap.m.ProgressIndicator({
                            height: "15px"
                        }).addEventDelegate({
                            onAfterRendering: function (oEvent) {
                                var $Control = oEvent.srcControl.$();
                                $Control.css("margin", "0");
                                $Control.css("border", "0px");
                                oEvent.srcControl.$("textLeft").css("line-height", "15px");
                                oEvent.srcControl.$("textRight").css("line-height", "15px");
                            }
                        }),
                        new sap.m.List({
                            noDataText: "Please select a unit"
                        })
                    ],
                    placement: sap.m.PlacementType.HorizontalPreferredRight
                });
            }

            this._oPopover.openBy(this._oValidateButton);
            return this._oPopover;
        },

        updateProgress: function (iValue) {
            var oProgress = this.getPopover().getContent()[0];

            oProgress.setPercentValue(iValue);
            oProgress.setDisplayValue(Math.round(iValue) + "%");
        },

        // add a new test to the result list
        addTestStatus: function (sTestName) {
            var oDisplayListItem = new sap.m.CustomListItem({
                content: [
                    new sap.m.Text({
                        text: sTestName
                    }).addStyleClass("sapUiSmallMarginEnd"),
                    new sap.m.BusyIndicator()
                ]
            }).addStyleClass("sapUiSmallMargin");

            this.getPopover().getContent()[1].addItem(oDisplayListItem);
        },

        // update the current test result
        updateTestResult: function (sTestName, sMessage, bStatus) {
            //var oDisplayListItem = this.getPopover().getContent()[1].getItems().pop;
            var oDisplayListItem = this.getPopover().getContent()[1].getItems().filter(function (oItem) {
                return (oItem.getContent()[0].getText().split(":")[0] === sTestName);
            })[0];

            oDisplayListItem.getContent()[0].setText(sTestName + (sMessage ? ": " + sMessage : ""));
            oDisplayListItem.removeContent(1);
            oDisplayListItem.addContent(
                new sap.ui.core.Icon({
                    src: (bStatus ? "sap-icon://sys-enter" : "sap-icon://sys-cancel"),
                    color: (bStatus ? "#007833" : "#cc1919")
                })
            );
        },

        // add a new test to the result list
        showCode: function () {
            
            var oDisplayListItem = new sap.m.CustomListItem({
                content: [
                    new sap.m.Text({
                        text: "Your result code is:",
                    }).addStyleClass("sapUiSmallMarginEnd").addEventDelegate({
                        onAfterRendering: function (oEvent) {
                            var $Control = oEvent.srcControl.$();
                            $Control.css("font-weight", "bold")
                        }
                    }),
                    new sap.m.Text({
                        text: Math.abs(this._sResult).toString()
                    }).addEventDelegate({
                        onAfterRendering: function (oEvent) {
                            var $Control = oEvent.srcControl.$();
                            $Control.css("font-weight", "bold")
                        }
                    }),
                ]
            }).addStyleClass("sapUiSmallMargin");

            // new sap.m.DisplayListItem({label: sMessage});
            this.getPopover().getContent()[1].addItem(oDisplayListItem);
        },

        // update the result after processing all the tests (title, progress, button)
        showResult: function (sMessage, bStatus) {
            var oPopover = this.getPopover(),
                oProgress = this.getPopover().getContent()[0],
                oTitle = oPopover.getCustomHeader().getContentMiddle()[0],
                oButton = sap.ui.getCore().byId("validate");

            oTitle.setText(sMessage);
            if (bStatus !== undefined) {
                if (bStatus) {
                    oTitle.$().css("color", "#007833");
                    oProgress.setState("Success");
                    oButton.$("inner").css("background", "#007833");
                } else {
                    oTitle.$().css("color", "#cc1919");
                    oProgress.setState("Error");
                    oButton.$("inner").css("background", "#cc1919");
                }
            } else {
                oTitle.$().css("color", "");
                oProgress.setState("None");
                oButton.$("inner").css("background", "#009de0");
            }
        },

        /**** Test runner functions ***/

        // clears the test results for the next run
        reset: function () {
            // clear list
            var oPopover = this.getPopover();
            this.showResult("Validating...");
            if (oPopover && oPopover.getContent()[1]) {
                oPopover.getContent()[0].setState("None");
                oPopover.getContent()[1].removeAllItems();
            }
            this._aAllTests = [];
            this._iTotalCount = 0;
            this._sResult = "";
            // TODO: clear OPA queue / abort processing

            // locally override this flag as OPA is running 300 seconds in debug mode
            window["sap-ui-debug"] = false;
        },

        // run all tests for the currently selected unit
        runTests: function (sKey) {
            var oPopover = this.getPopover(),
                fnUpdateTestResult = this.updateTestResult.bind(this),
                fnRankTest = this.rankTest.bind(this),
                fnShowCode = this.showCode.bind(this),
                fnShowResult = this.showResult.bind(this),
                bSomeTestFailed = false,
                bDebugMode = window["sap-ui-debug"],
                sKey = sKey || this.getUnitCookie() || "";

            this.setUnitCookie(sKey);

            // still old tests running, no further action
            if (this._aAllTests && this._aAllTests.length) {
                return;
            }

            // clear last run
            this.reset();

            // create our own promise-based queue
            var fnProcessAllTests = function () {
                // custom assert object similar to QUnit asssert (but way simpler)
                // TODO: why is this the assert object? works however if definition is put inside here
                var assert = {
                    ok: function (sMessage) {
                        fnRankTest(this.testName, sMessage, true);
                        fnUpdateTestResult(this.testName, sMessage, true);
                    },
                    notOk: function (sMessage) {
                        fnRankTest(this.testName, sMessage, false);
                        fnUpdateTestResult(this.testName, sMessage, false);
                    }
                };

                if (!this._iTotalCount) {
                    this._iTotalCount = this._aAllTests.length;
                }
                var aTest = this._aAllTests.shift();
                if (aTest) {
                    var sTestName = aTest[0],
                        fnTest = aTest[1];

                    jQuery.sap.log.debug("executing test '" + sTestName + "'");
                    this.addTestStatus(sTestName, "Running...");
                    this.updateProgress((this._iTotalCount - this._aAllTests.length) * 100 / this._iTotalCount);
                    fnTest(assert).done(fnProcessAllTests).fail(function () {
                        this._aAllTests = null;
                        window["sap-ui-debug"] = bDebugMode;
                    }.bind(this));
                } else {
                    if (!bSomeTestFailed && this._iTotalCount > 0) {
                        fnShowResult("All good!", true);
                        if(sKey.search("opt") > 0 ) {
                            //fnShowCode();
                        }
                    }
                    window["sap-ui-debug"] = bDebugMode;
                }
            }.bind(this);
            // execute the queue after all OpaTest calls are processed (synchronously)
            setTimeout(fnProcessAllTests, 0);

            // create our own opaTest wrapper (instead of QUnit we render the output to the popover)
            var opaTest = function (testName, callback) {
                var config = Opa.config;
                Opa.config.timeout = 5;

                var testBody = function (assert) {
                    assert.testName = testName;

                    callback.call(this, config.arrangements, config.actions, config.assertions, assert);

                    var promise = Opa.emptyQueue();
                    promise.done(function () {
                        Opa.assert = undefined;
                        Opa5.assert = undefined;
                    });

                    promise.fail(function (oOptions) {
                        Opa.assert = undefined;
                        Opa5.assert = undefined;
                        // TODO: globale ausgbae
                        bSomeTestFailed = true;
                        fnShowResult("Failed!", false);
                        if(sKey.search("opt") > 0 ) {
                            fnShowCode();
                        }
                    });
                    return promise;
                }.bind(this);
                this._aAllTests.push([testName, testBody]);
            }.bind(this);

            // Export to global namespace to be backwards compatible
            window.opaTest = opaTest;

            /********* test cases start here *********/
            // TODO: put them in separate files for each unit?
            var oTests = {
                "w1u1" : function () {
                    opaTest("Find a carousel in the app", function (Given, When, Then, assert) {
                        // Arrangements
                        // Actions
                        When.waitFor({
                            controlType: 'sap.m.Carousel',
                            success: function () {
                                assert.ok("funktionukkelt1");

                            },
                            error: function () {
                                assert.notOk("nööööö1");
                            }
                        });
                        // Assertions
                    });
                },
                "w1u2" : function () {
                    opaTest("Find a carousel", function (Given, When, Then, assert) {
                        // Arrangements
                        // Actions
                        When.waitFor({
                            controlType: 'sap.m.Carousel',
                            success: function () {
                                assert.ok("works");

                            },
                            error: function () {
                                assert.notOk("Could not find a carousel");
                            }
                        });
                        // Assertions
                    });

                    opaTest("This test will fail, looking for a control named nonsense", function (Given, When, Then, assert) {
                        // Arrangements
                        // Actions
                        When.waitFor({
                            controlType: 'sap.m.Table',
                            success: function () {
                                assert.ok("This will never happen");

                            },
                            error: function () {
                                assert.notOk("Oh no!");
                            }
                        });
                        // Assertions
                    });

                    opaTest("Find a page control", function (Given, When, Then, assert) {
                        // Arrangements
                        // Actions
                        When.waitFor({
                            controlType: 'sap.m.Page',
                            success: function () {
                                assert.ok("funktionukkelt2");

                            },
                            error: function () {
                                assert.notOk("nööööö2");
                            }
                        });
                        // Assertions
                    });
                },
                "w1opt" : function () {
                    opaTest("Go to tab with key 'db'", function (Given, When, Then, assert) {
                		// Actions (click on db tab)
                        When.waitFor({
                            controlType: 'sap.m.IconTabBar',
                            success : function (aIconTabBars) {
                            	var oIconTabBar = aIconTabBars[0];
                            	if ((oIconTabBar.getSelectedKey() === "db" && oIconTabBar.getExpanded() !== true) || oIconTabBar.getSelectedKey() !== "db") {
									this.waitFor({
										controlType: 'sap.m.IconTabFilter',
										matchers : [
											new PropertyStrictEquals({name : "key", value : "db"}),
											new Ancestor(oIconTabBar[0])
										],
										actions: new Press()
									});
								}
							},
							success: function () {
								assert.ok("Opened tab");
							},
							error: function () {
								assert.notOk("Could not open tab");
							}
                        });
                	});
                },
                "w2u1" : function () {
                	opaTest("Go to tab with key 'db'", function (Given, When, Then, assert) {
                		// Actions (click on db tab)
                        When.waitFor({
                            controlType: 'sap.m.IconTabBar',
                            success : function (aIconTabBars) {
                            	var oIconTabBar = aIconTabBars[0];
                            	if ((oIconTabBar.getSelectedKey() === "db" && oIconTabBar.getExpanded() !== true) || oIconTabBar.getSelectedKey() !== "db") {
									this.waitFor({
										controlType: 'sap.m.IconTabFilter',
										matchers : [
											new PropertyStrictEquals({name : "key", value : "db"}),
											new Ancestor(oIconTabBar[0])
										],
										actions: new Press()
									});
								}
							},
							success: function () {
								assert.ok("Opened tab");
							},
							error: function () {
								assert.notOk("Could not open tab");
							}
                        });
                	});
                	
                    opaTest("Find a list inside the tab", function (Given, When, Then, assert) {
                        // Assertions (check if there is a list inside the filter)
						Then.waitFor({
							controlType: 'sap.m.IconTabFilter',
                            matchers : new PropertyStrictEquals({name : "key", value : "db"}),
                            success: function (aFilters) {
                            	var oFilter = aFilters[0];
                            	
                            	this.waitFor({
									controlType : "sap.m.List",
									matchers: Ancestor(oFilter),
									success: function () {
										assert.ok("Found the list inside the IconTabFilter");
									},
									error: function () {
										assert.notOk("Did not find the list");
									}
								});
							}
						});
                    });
                    
                    opaTest("Check that the list is not empty", function (Given, When, Then, assert) {
						Then.waitFor({
							controlType: 'sap.m.IconTabFilter',
                            matchers : new PropertyStrictEquals({name : "key", value : "db"}),
                            success: function (aFilters) {
                            	var oFilter = aFilters[0];
                            	
                            	this.waitFor({
									controlType : "sap.m.List",
									matchers: [
										new AggregationFilled({ name: "items"}),
										 Ancestor(oFilter)
									],
									success: function () {
										assert.ok("The list is not empty");
									},
									error: function () {
										assert.notOk("The list is empty");
									}
								});
							}
						});
                    
                });
            }
            };

            // run the selected tests
            if(oTests[sKey]) {
                oTests[sKey]();
            } else if (sKey) {
                this.showResult("Error!", false);
                jQuery.sap.log.error("Tests for key '" + sKey + "' not found");
            } else {
                this.showResult("Select:");
            }

        }
    });

    // attach the validator to the global init event of UI5
    sap.ui.getCore().attachInit(function () {
        new opensap.validator().init();
    });
});