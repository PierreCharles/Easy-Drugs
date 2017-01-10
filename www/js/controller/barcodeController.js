/*
 File : barcodeController.js
 The BarcodeController interact with the barcode view
 */

'Use Strict';

angular.module('App')

    .controller('BarcodeController', function($scope, $cordovaBarcodeScanner, $state, $ionicHistory, DrugsService, Drugs, $ionicLoading, $ionicModal, $ionicPopup) {

        var self = this;

        $ionicModal.fromTemplateUrl('templates/login.html', {
          scope: $scope
        }).then(function(modal) {
          $scope.modal = modal;
        });
        this.showLoading = function(message) {
            $ionicLoading.show({
                template: '<ion-spinner>'+message+'</ion-spinner>'
            });
        };

        this.hideLoading = function(){
            $ionicLoading.hide();
        };

        $scope.drug2 = {'title':'','subname':''};

        var showPopup = function(code) {
            // An elaborate, custom popup
            var myPopup = $ionicPopup.show({
                template: '<input type="textarea" placeholder="Drug\'s name" ng-model="drug2.title"><input type="textarea" placeholder="Drug\'s subname" ng-model="drug2.subname">',
                title: 'Add drug',
                subTitle: 'Do you want to add this drug in the database ?',
                scope: $scope,
                buttons: [
                    { text: 'No' },
                    {
                        text: '<b>Yes</b>',
                        type: 'button-positive',
                        onTap: function(e) {
                            //$scope.modal.show();
                            if(code.indexOf('01') !== -1) { 
                                var drugToAdd = {title:$scope.drug2.title, subname:$scope.drug2.subname, bar_code:'', flash_code:code};
                            }
                            else {
                                var drugToAdd = {title:$scope.drug2.title, subname:$scope.drug2.subname, bar_code:code, flash_code: ''};
                            }
                            // Add drug in DB
                            alert(JSON.stringify(drugToAdd));

                            self.showLoading('');
                            var myDrugDataPromise = Drugs.addDrug(drugToAdd);
                            myDrugDataPromise.then(function(result) {
                                var resId = result;
                                alert(resId);
                                // Go on drug page
                                $state.go('app.drug', { 'drugId': resId });
                            });
                            self.hideLoading();

                        }
                    }
                ]
            });

            myPopup.then(function(res) {
                console.log('Tapped!', res);
            });
        };

        showPopup('0145467512754');

        $scope.scanBarcode = function() {

            $scope.drugCode = '';

            if(ionic.Platform.platforms[0] != "browser"){

                $cordovaBarcodeScanner.scan().then(function(imageData) {

                    if(imageData.text.indexOf('01') !== -1) {                     
                        // Decompose flash code for getting CIP
                        $scope.drugCode = imageData.text.substring(1,19);
                    }
                    else {
                        $scope.drugCode = imageData.text;
                    }
                    self.showLoading('');

                    var myDrugDataPromise = Drugs.getDrugId($scope.drugCode);
                    myDrugDataPromise.then(function(result) {

                        var res = result;
                        if(res != -1) {
                            if(imageData.text.indexOf('01') !== -1) {  // --> This is a flash code           
                                // Get expiration date from flash code
                                var expDateTmp = imageData.text.substring(19,25);
                                DrugsService.expDate = "Expiration date : " + expDateTmp.substring(2,4) + "/" + expDateTmp.substring(0,2);
                            }
                            else {
                                DrugsService.expDate = '';
                            }
                            $state.go('app.drug', { 'drugId': res });
                            $ionicHistory.nextViewOptions({
                                disableBack: false
                            });
                        }

                        else {  
                            alert("Unknow drug !");                      
                            showPopup($scope.drugCode);

                        }
                    });
                    self.hideLoading();

                }, function(error) {
                    console.log("An error happened -> " + error);
                });

            } else {
                alert("Sorry, you cannot use this function on browser.");
            }
        };

    });