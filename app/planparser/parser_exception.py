# Custom clas for parsing exceptions
# Should have one message string argument
class ParserError(Exception):
    pass

# checks a rule for mandatory fields
# raise ParserError if field not found
# sets the defaults for optional fields
# return complete rule
def check_parsing_rule(rule, name, mandatory, optional):
    r = {}
    for m in mandatory:
        if m in rule:
            r[m] = rule[m]
        else:
            raise ParserError('No %s parsing rule for %s'%(m, name))
    for o in optional:
        r[o[0]] = rule[o[0]] if o[0] in rule else o[1]
    return r

    
