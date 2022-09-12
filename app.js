const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require('mongoose')
const _ = require("lodash");
//mods
const dbUrl = "mongodb+srv://me-cyno:me-cyno@cluster0.t4pprnz.mongodb.net/todolistDB?retryWrites=true&w=majority" 

const connectionParams = {
  useNewUrlParser: true,
  useUnifiedTopology: true
}

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));


mongoose.connect(dbUrl, connectionParams).then(()=>{
  console.info("Connected to the DB!");
})
.catch((e)=>{
  console.log("Error:", e);
});


const itemsSchema = {
  name: String
}

const Item = mongoose.model("Item", itemsSchema)

const item1 = new Item({
  name: "Welcome to your todolist!"
})

const item2 = new Item({
  name: "Hit the + button to add a new item."
})

const item3 = new Item({
  name: "<-- Hit this to delete an item."
})

const defaultItems = [item1, item2, item3];

const listSchema = {
  name: String,
  items: [itemsSchema]
};

const List = mongoose.model("List", listSchema);

app.get("/", function(req, res) {

  Item.find({}, function(err, foundItems){

    if(foundItems.length === 0){
      Item.insertMany(defaultItems, function(err){
        if(err){
        console.log(err)
        }else{
          console.log("Default items added")
        }
      }); 
      res.redirect("/");
 } else{
  res.render("list", {listTitle: "Today", newListItems: foundItems});
    }

  })

});

app.get("/:customListName", function(req, res){
  const customListName = _.capitalize(req.params.customListName);

  List.findOne({name: customListName}, function(err, foundList){
    if(!err){
      if(!foundList){
        //Create a new list
        const list = new List({
          name: customListName,
          items: defaultItems
        })
      
        list.save();
        res.redirect("/" + customListName)
      
      } else{
        //Show an existing list
        res.render("list", {listTitle: foundList.name, newListItems: foundList.items})
      }
    }
  });



});


app.post("/", function(req, res){

 const itemName = req.body.newItem; 
 let listName = req.body.list;

/*The problem arises because listName is 
  sending whitespace along with
  the name so the space is added to url as "%20",
  everytime you add new item to the page. */


 if(listName){
  listName = listName.trim();
 }

/*This will erase extra spaces 
so you will always refresh to the desired url. */

 const item = new Item({
  name: itemName
 })

 if(listName === "Today"){
  item.save();
  res.redirect("/");
 } else{
    List.findOne({name: listName }, function(err, foundList){
      foundList.items.push(item);
      foundList.save();
      res.redirect("/" + listName)
      });
 }


});


app.post("/delete", function(req, res){
  const checkedItemid = req.body.checkbox
  const listName = req.body.listName;

  if (listName === "Today"){
    Item.findByIdAndRemove(checkedItemid, function(err){
      if(err){
        console.log(err)
      } else{
        console.log("Checked item deleted from Database!")
        res.redirect("/")
      }
    });
      } else{
        List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemid}}}, function(err, foundList){
          if(!err){
            res.redirect("/" + listName);
          }
        });
  }
  });



app.get("/about", function(req, res){
  res.render("about");
});



let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}

app.listen(port, function() {
  console.log("Server started successfully");
});
