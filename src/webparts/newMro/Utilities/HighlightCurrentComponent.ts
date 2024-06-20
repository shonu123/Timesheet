export const highlightCurrentNav = (linkName) => {
    let navLinks = document.querySelectorAll('.nav-click');
    if (navLinks.length > 0) {
        navLinks.forEach(item => {
            item.className = 'dropdown-item';
        });
    }
    let Link = document.querySelectorAll('.nav-click2');
    if (Link.length > 0) {
        Link.forEach(item => {
            item.className = '';
        });
    }

    //document.getElementById(linkName).className = 'nav-click';
    if(document.getElementById(linkName)!=null){
        document.getElementById(linkName).className = 'nav-click dropdown-item';
    }
};
export const highlightCurrentNav2 = (linkName) => {
    let navLinks = document.querySelectorAll('.nav-click2');
    if (navLinks.length > 0) {
        navLinks.forEach(item => {
            item.className = '';
        });
    }
    //document.getElementById(linkName).className = 'nav-click';
    if(document.getElementById(linkName)!=null){
        document.getElementById(linkName).className = 'nav-click2';
    }
};


export const sortDataByTitle = (data,property)=>{
    data.sort((a,b)=>{
        let fa = a[`${property}`].toLowerCase();
         let fb = b[`${property}`].toLowerCase();
       if (fa < fb) {
               return -1;
           }
           if (fa > fb) {
               return 1;
           }
           return 0;
       });
       return data;
};
