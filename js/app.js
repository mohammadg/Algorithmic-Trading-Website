var app = angular.module("trockWeb", []);

app.controller("VersionController", function($scope, $sce, $http, $window, $document) {

  //Used to store deployment info, versions, descriptions in scope
  $scope.versions = [];
  $scope.downloadTable = [];
  $scope.descriptions = [];
  
  $scope.osDetectionFirst = true;
  
  //Retrieve all build versions
  $http.get('json/versions.json').
  success(function(data, status, headers, config) {
    //Push required fields onto array
    //We push all the info we need into arrays for later use
    data.forEach(function(item1) {
    
      $scope.versions.push({
        versionNum: item1.version,
        short_descr: item1.short_descr
      });
    
      item1.links.forEach(function(item2) {
        $scope.downloadTable.push({
          id: item2.id,
          link: item2.link,
          link_testingplatform: item2.link_testingplatform,
          os: item2.os
        });
          
        $scope.descriptions.push({
        version: item1.version,
        id: item2.id,
        link: item2.link,
        changes: item1.changes,
        changes_testingplatform: item1.changes_testingplatform,
        description: item1.description,
        date: item1.date,
        os: item2.os,
        checksum: item2.SHA_link,
        checksum_testingplatform: item2.SHA_link_testingplatform
        });
      });
    });
    
    //Set version to latest by default
    //We do this here as it is at this stage that we have parsed our JSON file and populated our select
    $scope.versionID = $scope.versions[0];
    
    //Once version is set, try to show build info
    if (typeof $scope.operatingSystemID  !== 'undefined')
      $scope.showBuildInfo($scope.versionID.versionNum, $scope.operatingSystemID.id)
  });
  
  //Create supported operating systems list
  $scope.osList = [
    {
      id: "win32",
      label: "Windows (32/64 bit)"
    },
    {
      id: "mac32",
      label: "Mac OS (32/64 bit)"
    },
    {
      id: "lin32",
      label: "Linux (32 bit)"
    },
    {
      id: "lin64",
      label: "Linux (64 bit)"
    }
  ];
  
  //Auto select Operating System based on detection
  $scope.detectOS = function() {
    var processorArchitecture = "";
    var processorArchitectureCompat = "";
    var userOS = "";
    var userOSNicename = "";

    //Check for 64bit processor architecture
    if (navigator.userAgent.indexOf("WOW64") != -1 || 
      navigator.userAgent.indexOf("Win64") != -1 || 
      navigator.userAgent.indexOf("x86_64") != -1 ||
      navigator.userAgent.indexOf("x86-64") != -1 ||
      navigator.userAgent.indexOf("x64;") != -1 ||
      navigator.userAgent.indexOf("amd64") != -1 ||
      navigator.userAgent.indexOf("AMD64") != -1 ||
      navigator.userAgent.indexOf("x64_64") != -1 ||
      navigator.userAgent.indexOf("ia64") != -1 ||
      navigator.userAgent.indexOf("sparc64") != -1 ||
      navigator.userAgent.indexOf("ppc64") != -1 ||
      navigator.userAgent.indexOf("IRIX64") != -1){
     processorArchitecture = "64";
    } else { //Otherwise just assume 32 bit machine
     processorArchitecture = "32";
    }
    
    processorArchitectureCompat = processorArchitecture;

    //Detect the OS
    if (navigator.platform.indexOf("Win") != -1){
     userOS = "win";
     userOSNicename = "Windows";
     
     if (processorArchitecture == "64")
      processorArchitectureCompat = "32";
    } 
    else if (navigator.platform.indexOf("Mac") != -1){
     userOS = "mac";
     userOSNicename = "Mac OS";
     
     if (processorArchitecture == "64")
      processorArchitectureCompat = "32";
    } 
    else if (navigator.platform.indexOf("Lin") != -1){
      userOS = "lin";
      userOSNicename = "Linux";
    }
    
    //Check for valid detection
    if (userOS != "" && processorArchitecture != "") {
      //Valid match found
      var optionSelectionID = userOS + processorArchitectureCompat;
      
      //Output detected option to os message section
      $scope.os_detection_box =  $sce.trustAsHtml("(We have detected your OS as " + userOSNicename + " " +processorArchitecture + " bits)");
      
      //Auto select the detected option
      $scope.operatingSystemID = {id: optionSelectionID};
      
      //Once OS is set, try to show build info
      if (typeof $scope.versionID !== 'undefined')
        $scope.showBuildInfo($scope.versionID.versionNum, $scope.operatingSystemID.id)
    }
    else {
      //Failed to auto detect OS
      //If this isn't initial detection, show error message
      if (!$scope.osDetectionFirst)
        $scope.os_detection_box =  $sce.trustAsHtml("(OS detection failed, please manually select desired OS.)");
      
      $scope.osDetectionFirst = false;
    }
  };
  
  //Used to clear auto detection box
  $scope.clearOS = function () {
    $scope.os_detection_box =  $sce.trustAsHtml("");
  };
  
  //Function used to trigger file download by means of redirection (window.location)
  $scope.downloadFile = function(type, versionID, operatingSystemID) {
    var deploymentID = versionID + operatingSystemID;
    var deploymentFound = 0;
    
    if(typeof versionID === 'undefined' || versionID == ""
        || typeof operatingSystemID === 'undefined' || operatingSystemID == "" ) 
    {
      $scope.error_box =  $sce.trustAsHtml("Please select a valid deployment version and operating system.");
      return;
    }
    else {
      $scope.downloadTable.forEach(function(data) {
      if (data.id == deploymentID) {
        var downlink;
        
        //Set downlink based on type provided
        // 1 = downloading core module
        // 2 = downloading testing platform
        if (type == 1)
          downlink = data.link;
        else if (type == 2)
          downlink = data.link_testingplatform;
          
        if (downlink == "") {
          $scope.error_box =  $sce.trustAsHtml("This download is not available for the selected version.");
          return;
        }
        else {
          deploymentFound = true;
          //Clear error box
          $scope.error_box =  $sce.trustAsHtml("");
          $window.location.href = "/".concat(downlink);
        }
      }
      });
    }
    
    //Check if we failed to find a deployment
    if (!deploymentFound) {
      $scope.error_box =  $sce.trustAsHtml("This version and operating system is not supported for that download.");
    }
  };
  
  //Function used to display build info once program version is selected
  $scope.showBuildInfo = function(versionID, operatingSystemID) {
      if(typeof versionID === 'undefined' || versionID == ""
        || typeof operatingSystemID === 'undefined' || operatingSystemID == "" ) {
          $scope.info_description =  $sce.trustAsHtml("Please select a version.");
          $scope.info_changes =  $sce.trustAsHtml("Please select a version to see changes.");
          $scope.info_changes_testingplatform = $sce.trustAsHtml("Please select a version to see changes.");
          return;
      }
      
      //Deployment ID is the combination of versionId + operatingsystemID
      var deploymentID = versionID + operatingSystemID;
      var deploymentFound = 0;
      
      $scope.descriptions.forEach(function(data) {
         if (data.id == deploymentID) {
             var osImage = "";
             deploymentFound = true;
              //Clear error box
              $scope.error_box =  $sce.trustAsHtml("");
             
             //Determine OS Image
             if (data.os == "Windows")
              osImage = "/images/windows.png";
             else if (data.os == "Mac OS")
              osImage = "/images/macos.png";
             else if (data.os == "Linux")
              osImage = "/images/linux.png";
             
             $scope.info_description =  $sce.trustAsHtml(
             "<strong>Version: </strong>" + data.version + "<br />" +
             "<strong>OS: </strong><img src=\"" + osImage + "\" /> " + data.os + "<br />" + "<strong>Date: </strong>" + data.date + "<br />" + "<strong>TrockAT Standalone SHA-1 Checksum: </strong>" + data.checksum + "<br />" + "<strong>Testing Platform (GUI) SHA-1 Checksum: </strong>" + data.checksum_testingplatform + "<br /><br />" + data.description);

             $scope.info_changes =  $sce.trustAsHtml("<li>" + data.changes.split("|").join("</li><li>") + "</li>");
             $scope.info_changes_testingplatform =  $sce.trustAsHtml("<li>" + data.changes_testingplatform.split("|").join("</li><li>") + "</li>");
         }
      });
      
      //Check if we failed to find a deployment
      if (!deploymentFound) {
          $scope.info_description =  $sce.trustAsHtml("This version and operating system is not supported.");
          $scope.info_changes =  $sce.trustAsHtml("Please select a version to see changes.");
          $scope.info_changes_testingplatform = $sce.trustAsHtml("Please select a version to see changes.");
          
          //Also update error box
          $scope.error_box =  $sce.trustAsHtml("This version and operating system is not supported.");
      }
        
  };
  
  //Set default description and change box values
  $scope.info_description =  $sce.trustAsHtml("Please select a version.");
  $scope.info_changes =  $sce.trustAsHtml("Please select a version to see changes.");
  $scope.info_changes_testingplatform = $sce.trustAsHtml("Please select a version to see changes.");

});

//Viewer controller is used to dynamically load each page
app.controller("ViewerController", function ViewerController($scope, $sce, $location, $timeout, $http, $compile, $anchorScroll) {
  
  //Load a website into the content div
  $scope.loadContent = function(webpageName) {
    $http.get("includes/".concat(webpageName)).
    success(function(data, status, headers, config) {
      $scope.content =  $sce.trustAsHtml(data);
    });
  };
  
  //Add scroll function to serve as alternative for anchor tags
  $scope.scrollTo = function(id) {
      $location.hash(id);
      $anchorScroll();
   };
  
  //Get url and load content
  if ($location.path() == "") {
    $timeout(function() { $scope.loadContent("home.html");}, 200);
  }
  else {
    //Check if file exists
    var request = new XMLHttpRequest();
    request.open('HEAD', "/includes" + $location.path() + ".html", false);
    request.send();
    
    //If file exists load proper page
    if(request.status == 200) {
      $timeout(function() { $scope.loadContent($location.path().substring(1) + ".html");}, 1000); //remove first '/' char from url
    }
    //Otherwise load the 404 page
    else
      $timeout(function() { $scope.loadContent("404.html");}, 200);
  }
  
}).directive('compile', function($compile, $parse) {
  return {
    link: function(scope, element, attr) {
      var parsed = $parse(attr.ngBindHtml);

      function getStringValue() {
        return (parsed(scope) || '').toString();
      }

      //Recompile if the template changes
      scope.$watch(getStringValue, function() {
        $compile(element, null, -9999)(scope); //The -9999 makes it skip directives so that we do not recompile ourselves
      });
    }
  };
});