const express = require("express")
const app = express();
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const async = require("hbs/lib/async");
const _ = new require("lodash");
const dotenv=require("dotenv");
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
dotenv.config({ path: "./config.env" });

//Testing database connection to mongoDB

if (mongoose.connect(`mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@devloperdb.nmc9xqy.mongodb.net/todolistDB`)) {
    console.log("database connected");
} else {
    console.log("connection to database failed");
}

// defining the schema for collection ITEM

const itemsShema = new mongoose.Schema({
    name: String
});

const Item = mongoose.model("Item", itemsShema);

// creating the default values for the database
const item1 = new Item({
    name: "Welcome to ToDo List APP"
});

const defaultItems = [item1];

const listSchema = {
    name: String,
    items: [itemsShema]
};

const List = mongoose.model("List", listSchema);


// handle root route
app.get("/", (req, res) => {
    
    
    async function fetchItems() {
  try {
      const foundItems = await Item.find({});
      if (foundItems.length === 0) {
          
          Item.insertMany(defaultItems);
          res.redirect("/");
      } else {
          res.render("list", { listTitle: "Today",newListItems:foundItems}); 
      }
     
  } catch (err) {
    console.error(err);
  }
}

fetchItems();

     
})

// handle dynamic route

app.get("/:customListName", (req, res) => {
    const customListName = _.capitalize(req.params.customListName);
    
    List.findOne({ name: customListName }).then((foundList) => {
        if (!foundList) {
            // create the new list
            const list = new List({
                name: customListName,
                items: defaultItems
            });
         list.save();
            res.redirect("/" + customListName);
           
        } else {
            
            // show the existing list
            res.render("list", { listTitle: foundList.name, newListItems: foundList.items });
        }
    }).catch((err) => {
        console.log(err);
    });
});


// Handle root post
// Handle root post
app.post("/", (req, res) => {
    const itemName = req.body.newItem;
    const listName = req.body.list;
    const item = new Item({
        name: itemName
    });

    if (listName === "Today") {
        item.save().then(() => {
            res.redirect("/");
        }).catch((err) => {
            console.log(err);
            // Handle error as needed
        });
    } else {
        List.findOne({ name: listName }).then((foundList) => {
            if (foundList) {
                foundList.items.push(item);
                return foundList.save();
            } else {
                // Create a new list with the provided name if it doesn't exist
                const newList = new List({
                    name: listName,
                    items: [item]
                });
                return newList.save();
            }
        }).then(() => {
            res.redirect("/" + listName);
        }).catch((err) => {
            console.log(err);
            // Handle error as needed
        });
    }
});

// handle del route post request for the checkbox
app.post("/del", (req, res) => {
    const checkedItemId = req.body.checkbox;
    const listName = req.body.listName;
    if (listName === "Today") {
        async function deleteRequestedItem(){
       try {
           await Item.findByIdAndRemove(checkedItemId);
           res.redirect("/");
       } catch(err) {
           console.log(err);
        }
    }
    deleteRequestedItem();
    } else {
        try {
  const foundList = List.findOneAndUpdate(
    { name: listName },
    { $pull: { items: { _id: checkedItemId } } }
  ).exec();

  if (!foundList) {
    console.log("List not found");
    return res.redirect("/");
  }

  res.redirect("/" + listName);
} catch (err) {
  console.log(err);
  // Handle error as needed
  // Redirect or send an error response
}
        
    }
   
})

// server listening on port 3000
app.listen(3000, () => {
    console.log("server is running on port 3000");
})