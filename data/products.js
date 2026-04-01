const products = [ // an array (a list) of objects (each object = one product with its details)
    {
        id: 1,
        name: "Classic White Shirt",
        price: 850,
        category: "shirts",
        stock: 45, // stock = how many units are available
        description: "100% cotton, regular fit"
    },
    {
        id: 2,
        name: "Black Slim Jeans",
        price: 1400,
        category: "pants",
        stock: 30,
        description: "Stretch denim, slim fit"
    },
    {
        id: 3,
        name: "Polo T-Shirt",
        price: 650,
        category: "tshirts",
        stock: 60,
        description: "Pique cotton, multiple colors"
    },
    {
        id: 4,
        name: "Formal Blazer",
        price: 3200,
        category: "jackets",
        stock: 15,
        description: "Polyester blend, slim fit"
    }
];

module.exports = products; 