function generateSquareMaze(dimension) {
  const iterate = (field, x, y) => {
    field[x][y] = false;
    while (true) {
      const directions = [];
      if (x > 1 && field[x - 2][y] == true) directions.push([-1, 0]);
      if (x < field.dimension - 2 && field[x + 2][y] == true)
        directions.push([1, 0]);
      if (y > 1 && field[x][y - 2] == true) directions.push([0, -1]);
      if (y < field.dimension - 2 && field[x][y + 2] == true)
        directions.push([0, 1]);
      if (directions.length === 0) return field;
      const dir = directions[Math.floor(Math.random() * directions.length)];
      field[x + dir[0]][y + dir[1]] = false;
      field = iterate(field, x + dir[0] * 2, y + dir[1] * 2);
    }
  };

  const field = Array.from({ length: dimension }, () =>
    Array(dimension).fill(true)
  );
  field.dimension = dimension;

  return iterate(field, 1, 1);
}
