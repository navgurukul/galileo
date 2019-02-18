export const getIsSolutionAvailable=function (exercise) {
    let isSolutionAvailable = true;
    if (exercise.solution === null) {
        isSolutionAvailable = false;
    }
    return isSolutionAvailable;
};


export const listToTree =function (list) {
    var map = {}, node, roots = [], i;
    
    for (i = 0; i < list.length; i += 1) {
        map[list[i].menteeId] = i; // initialize the map
        list[i].children = []; // initialize the children
    }
    
    for (i = 0; i < list.length; i += 1) {
        node = list[i];
        //if (node.parent !== "0") {
            // if you have dangling branches check that map[node.parentId] exists
            if(map[node.mentorId]){
            list[map[node.mentorId]].children.push(node);
        } else {
            roots.push(node);
        }
    }
    
    return roots;
}