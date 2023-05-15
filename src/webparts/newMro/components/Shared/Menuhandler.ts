function showmenu(){
  let event = this;
  let nav = event.nextElementSibling.className;
  let nexthtml =event.nextElementSibling;
  document.querySelectorAll('#navbarSupportedContent .show').forEach(item =>{
    if(item)
    {
      console.log(nexthtml,item);
      if(nexthtml !=item)
      item.className="dropdown-menu multi-level";  
    }
    });  
    console.log(nav);
  if(nav =="dropdown-menu multi-level show"){
    nexthtml.className="dropdown-menu multi-level";
    }else{
      nexthtml.className="dropdown-menu multi-level show";
    }
}
document.querySelectorAll('.nav-link').forEach(item =>{
  if(item)
  {
    item.addEventListener('click', showmenu, false);  
}
  });

  var div = document.querySelector("#site_content");
  console.log(div);
  if(div)
  {
  div.addEventListener('click', (event)=> {
    hidemenu();});
  }
  function hidemenu(){
    document.querySelectorAll('#navbarSupportedContent .show').forEach(item =>{
      if(item)item.className="dropdown-menu multi-level";
      });
  }

