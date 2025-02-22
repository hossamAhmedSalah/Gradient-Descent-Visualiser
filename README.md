# Gradient Descent Visualiser 🎯

A visualisation tool for understanding gradient descent in both 2D and 3D spaces. This tool allows you to explore how gradient descent works on various functions and observe the optimization process in action.

---

## Features ✨
- **2D Mode**: Visualize gradient descent on 2D functions.
- **3D Mode**: Explore gradient descent on 3D surfaces.
- **Interactive**: Adjust parameters like learning rate, number of iterations, and see how random starting points can affect the algorithm.
- **Real-time Updates**: Watch the algorithm converge step-by-step.
- **Export to PDF** : you can export the work you have done in a PDF file containing the function graph and the iterations in table.
- **Back through time** : you can return to any previous point the algorithm has gone through using the iteration logs.
- **Dark & Light themes** : work in a confortable theme. 
---

## Examples of Functions to Try 🧪

### 2D Functions
Here are some 2D functions you can experiment with:
- **Quadratic Function**: `Math.pow(x, 2)`  
  A simple convex function to understand the basics of gradient descent.
- **Quartic Function**: `Math.pow(x, 4) - 2 * Math.pow(x, 2)`  
  A non-convex function with multiple local minima, great for testing convergence.
- **Rastrigin-like Function**: `10 + Math.pow(x, 2) - 10 * Math.cos(2 * Math.PI * x)`  
  A function with many local minima, perfect for observing how gradient descent handles complex landscapes.

### 3D Functions
Explore these 3D functions to see gradient descent in higher dimensions:
- **Simple Quadratic**: `x*x + y*y`  
  A basic convex surface for understanding gradient descent in 3D.
- **Trigonometric Surface**: `Math.sin(x/2) * Math.cos(y/2)`  
  A wavy surface to observe how gradient descent navigates non-linear landscapes.
- **Radial Sine Function**: `Math.sin(Math.sqrt(x*x + y*y)) / 2`  
  A circular pattern with varying gradients.
- **Distance Function**: `Math.sqrt(x*x + y*y)`  
  A cone-shaped surface to visualize gradient descent on a non-smooth function.

---

## How to Use 🛠️
1. Open the [Gradient Descent Visualiser](https://hossamahmedsalah.github.io/Gradient-Descent-Visualiser/).
2. Select either **2D** or **3D** mode.
3. Input a function from the examples above or try your own.
4. Adjust parameters like learning rate and number of iterations.
5. Click **Run ▶️** to visualize the gradient descent process.

---

## Visual Examples 🎥

### 2D Mode
![2D Gradient Descent Example](https://github.com/hossamAhmedSalah/Gradient-Descent-Visualiser/blob/main/GD_001.gif)  
*Gradient descent on `x*x` showing convergence to a local minimum.*

### 3D Mode
![3D Gradient Descent Example](https://github.com/hossamAhmedSalah/Gradient-Descent-Visualiser/blob/main/GD_002.gif)  
*Gradient descent on `Math.sin(Math.sqrt(x*x + y*y)) / 2` demonstrating optimization on a 3D surface.*

---

## Try It Out! 🚀
Explore the tool and see gradient descent in action:  
👉 [Gradient Descent Visualiser](https://hossamahmedsalah.github.io/Gradient-Descent-Visualiser/)

---

> This code is made with AI tools guided by human instructions, for educational purposes. 
