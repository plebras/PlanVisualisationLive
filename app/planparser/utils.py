def is_lambda(v):
  LAMBDA = lambda:0
  return isinstance(v, type(LAMBDA)) and v.__name__ == LAMBDA.__name__

def round_number(n):
    return float('%.3f'%(round(n, 3)))