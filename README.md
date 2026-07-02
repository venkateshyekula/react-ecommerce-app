# ShopEase - React TypeScript E-commerce App

ShopEase is a complete React TypeScript e-commerce web application built with Vite, React Router, Context API, useReducer, Bootstrap 5, custom CSS, localStorage, and JSON Server mock backend.

The application supports user authentication, product catalog, product filtering, cart management, checkout, order placement, order history, order tracking, and reorder functionality.

---

## Features

### Authentication

- Register new user
- Login existing user
- Logout
- Profile page
- Protected routes
- Current logged-in user persisted in localStorage
- Validation for required fields, email, password, mobile number, and address
- JSON Server user validation

### Product Catalog

- Product listing page
- Product details page
- Category-based product pages
- Product search
- Product filtering by:
  - Category
  - Brand
  - Price range
  - Rating
- Responsive product card grid
- Add to cart
- Out-of-stock product handling

### Shopping Cart

- Add to cart
- Remove from cart
- Increase quantity
- Decrease quantity
- Clear cart
- Cart item count in navbar
- Cart total calculation
- Cart persistence using localStorage
- useReducer cart state management

### Checkout

- Delivery address form
- Payment method selection
- Mock Credit Card payment fields
- Mock UPI payment field
- Cash on Delivery option
- Checkout validation
- Order creation using JSON Server
- Cart clearing after successful order
- Redirect to order success page

### Orders

- Order success page
- Order history page
- Order tracking timeline
- Reorder previous products
- Orders stored in JSON Server

### UI

- Bootstrap 5 responsive layout
- Custom professional CSS
- Modern cards, buttons, forms, shadows, spacing, and border radius
- Responsive navbar
- Mobile-friendly product grid
- Sticky filters on desktop
- Responsive cart and checkout layout

---

## Tech Stack

- React
- TypeScript
- Vite
- React Router DOM
- Context API
- useReducer
- Bootstrap 5
- Bootstrap Icons
- JSON Server
- localStorage
- Custom CSS

---

## Folder Structure

```txt
react-ecommerce-app/
  db.json
  package.json
  README.md

  src/
    components/
      common/
        Button.tsx
        EmptyState.tsx
        FormInput.tsx
        Loader.tsx

      layout/
        Footer.tsx
        Navbar.tsx

      products/
        ProductCard.tsx
        ProductFilter.tsx
        SearchBar.tsx

      cart/
        CartItem.tsx

      orders/
        OrderCard.tsx
        OrderTrackingTimeline.tsx

    context/
      AuthContext.tsx
      CartContext.tsx
      authContext.ts
      cartContext.ts
      useAuth.ts
      useCart.ts

    hooks/
      useLocalStorage.ts

    pages/
      HomePage.tsx
      LoginPage.tsx
      RegisterPage.tsx
      ProfilePage.tsx
      ProductListPage.tsx
      ProductDetailsPage.tsx
      CategoryPage.tsx
      CartPage.tsx
      CheckoutPage.tsx
      OrderSuccessPage.tsx
      OrderHistoryPage.tsx
      NotFoundPage.tsx

    routes/
      AppRoutes.tsx
      ProtectedRoute.tsx

    services/
      apiClient.ts
      authService.ts
      productService.ts
      orderService.ts

    types/
      api.ts
      auth.ts
      cart.ts
      order.ts
      product.ts

    utils/
      currencyFormatter.ts
      orderUtils.ts
      storage.ts
      validation.ts

    App.tsx
    main.tsx
    index.css
## Project Status

This project includes:

- React TypeScript frontend
- JSON Server backend
- Authentication flow
- Product catalog
- Search and filters
- Cart management
- Checkout
- Order history
- Order tracking
- Reorder functionality
- Responsive Bootstrap plus custom CSS UI
