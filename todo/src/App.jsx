import React, { useState } from 'react'
import TodoList from './components/TodoList'

function App() {
  const [todos, setTodos] = useState(["Todo 1", "Todo 2"])
  return (
    <>
      <TodoList todos={todos}/>
      <input type="text" />
      <button>Add Todo</button>
      <button>Clear completed Todos</button>
      <div>0 things left to do today</div>
    </>
  )
}

export default App
