# Complete DSA & LeetCode Master Topic Map

## 1. String Manipulation

### Overview

Strings are immutable sequences in Python. Most string problems involve pattern matching, transformation, parsing, or frequency analysis.

### Sub-topics

#### 1.1 Basic String Operations

- **Indexing & Slicing**: `s[i]`, `s[start:end]`, reverse with `s[::-1]`
- **Concatenation**: `+` operator, `''.join()` for efficiency
- **String Methods**: `split()`, `strip()`, `replace()`, `lower()`, `upper()`, `startswith()`, `endswith()`
- **Character Operations**: `ord()`, `chr()`, `isalpha()`, `isdigit()`, `isalnum()`

#### 1.2 Two-Pointer Techniques

- **Opposite Direction Pointers**: Palindrome validation, reversing
- **Same Direction Pointers**: Removing duplicates, partitioning
- **Sliding Window**: Variable/fixed-size windows for substrings

#### 1.3 Sliding Window Patterns

- **Fixed-Size Window**: Maximum of all subarrays of size k
- **Variable-Size Window**: Longest substring without repeating characters
- **Shrinking Window**: Minimum window substring
- **Character Frequency Window**: Anagrams, permutations

#### 1.4 Pattern Matching

- **Brute Force**: Naive pattern search O(nm)
- **KMP Algorithm**: Linear-time pattern matching
- **Rabin-Karp**: Rolling hash for substring search
- **Z-Algorithm**: Linear-time pattern matching
- **Regex Matching**: Dynamic programming approach
- **Wildcard Matching**: DP with `*` and `?`

#### 1.5 Palindromes

- **Validation**: Two pointers, checking equality
- **Longest Palindromic Substring**: Expand around center, Manacher's algorithm
- **Palindrome Partitioning**: Backtracking, DP optimization
- **Minimum Cuts**: DP for palindrome partitioning
- **Valid Palindrome Variations**: Ignoring cases, non-alphanumeric

#### 1.6 Anagrams & Permutations

- **Anagram Detection**: Sort comparison, frequency map
- **Group Anagrams**: Hash by sorted string or frequency tuple
- **Find All Anagrams**: Sliding window with frequency matching
- **Permutation in String**: Sliding window verification

#### 1.7 Subsequences & Substrings

- **Longest Common Subsequence (LCS)**: DP solution
- **Longest Common Substring**: DP with contiguous requirement
- **Distinct Subsequences**: Count variations using DP
- **Shortest Common Supersequence**: Combining strings optimally
- **Is Subsequence**: Two-pointer greedy approach

#### 1.8 String Transformation

- **String Compression**: Run-length encoding
- **String Decompression**: Decode compressed strings
- **Integer to String**: Base conversion, Roman numerals
- **String to Integer (atoi)**: Parsing with edge cases
- **Encode/Decode**: Design encoding schemes

#### 1.9 String Hashing

- **Polynomial Rolling Hash**: Efficient substring comparison
- **Hash Collisions**: Handling with multiple hash functions
- **Substring Hash**: Computing hashes for all substrings

#### 1.10 Lexicographic Problems

- **Next Permutation**: In-place lexicographic ordering
- **Next Greater Element**: Lexicographic comparisons
- **Smallest String**: Greedy selection

### Problem Archetypes

- Valid Palindrome, Longest Palindromic Substring
- Group Anagrams, Valid Anagram
- Longest Substring Without Repeating Characters
- Minimum Window Substring
- Implement strStr() (KMP)
- Regular Expression Matching
- String Compression/Decompression
- Decode String (nested brackets)
- Longest Common Subsequence
- Edit Distance
- Word Break, Word Break II
- Palindrome Partitioning
- Valid Parentheses
- Generate Parentheses

### Python-Specific Considerations

- Strings are immutable: use `list` for in-place modifications
- `''.join(list)` is O(n), repeated `+=` is O(n²)
- Use `collections.Counter` for frequency maps
- String slicing creates new strings (memory cost)
- `ord('a')` returns 97, useful for array indexing
- F-strings for formatting: `f"{var}"`

---

## 2. Arrays & Lists (Python Lists)

### Overview

Python lists are dynamic arrays supporting O(1) indexing and amortized O(1) append. Core structure for most algorithmic problems.

### Sub-topics

#### 2.1 Basic Operations

- **Indexing**: `arr[i]`, negative indexing `arr[-1]`
- **Slicing**: `arr[start:end:step]`
- **Mutation**: `append()`, `insert()`, `remove()`, `pop()`
- **List Comprehension**: `[x*2 for x in arr if x > 0]`

#### 2.2 Searching

- **Linear Search**: O(n) sequential scan
- **Binary Search**: O(log n) on sorted arrays
- **Binary Search Variations**: Lower bound, upper bound, rotated arrays
- **Search in Rotated Sorted Array**: Modified binary search
- **Find Peak Element**: Binary search on unimodal arrays

#### 2.3 Sorting

- **Built-in Sort**: `sorted()`, `list.sort()`, Timsort O(n log n)
- **Custom Comparators**: `key=lambda x: ...`, `functools.cmp_to_key`
- **Counting Sort**: O(n+k) for limited range
- **Merge Sort**: Stable O(n log n), divide and conquer
- **Quick Sort**: Average O(n log n), in-place partitioning
- **Quick Select**: O(n) average for k-th element

#### 2.4 Two-Pointer Techniques

- **Opposite Ends**: Two Sum in sorted array, container with most water
- **Fast-Slow Pointers**: Removing duplicates, partitioning
- **Three Pointers**: Dutch National Flag, 3Sum problems
- **Merge Two Sorted Arrays**: Two pointers from start

#### 2.5 Sliding Window

- **Fixed Window**: Maximum sum of k elements
- **Variable Window**: Longest subarray with sum ≤ k
- **Window Minimum/Maximum**: Using deque for optimization
- **Kadane's Algorithm**: Maximum subarray sum

#### 2.6 Prefix Sums & Cumulative Arrays

- **1D Prefix Sum**: Range sum queries in O(1)
- **2D Prefix Sum**: Matrix range queries
- **Difference Array**: Range update optimization
- **Subarray Sum Equals K**: Hash map with prefix sums

#### 2.7 Intervals & Ranges

- **Merge Intervals**: Sorting and merging overlaps
- **Insert Interval**: Adding to sorted interval list
- **Interval Intersection**: Finding overlaps
- **Meeting Rooms**: Checking conflicts, minimum rooms needed
- **Non-overlapping Intervals**: Greedy removal

#### 2.8 In-Place Manipulation

- **Remove Element**: Two pointers without extra space
- **Move Zeros**: Partitioning in-place
- **Rotate Array**: Reversal algorithm
- **Next Permutation**: In-place rearrangement
- **Array Deduplication**: Removing duplicates in sorted array

#### 2.9 Partitioning & Rearrangement

- **Partition by Pivot**: Quick sort partitioning
- **Dutch National Flag**: Three-way partitioning
- **Wiggle Sort**: Creating alternating pattern
- **Segregate Even/Odd**: Two-pointer partitioning

#### 2.10 Subarray Problems

- **Maximum Subarray Sum**: Kadane's algorithm
- **Maximum Product Subarray**: Tracking min and max
- **Minimum Size Subarray Sum**: Sliding window
- **Subarray Sum Divisible by K**: Hash map with modulo
- **Continuous Subarray Sum**: Prefix sum + hash map

#### 2.11 Matrix (2D Arrays)

- **Matrix Traversal**: Row-major, column-major, diagonal
- **Spiral Matrix**: Directional traversal
- **Rotate Matrix**: In-place 90° rotation
- **Set Matrix Zeros**: O(1) space marking
- **Search 2D Matrix**: Binary search variations
- **Diagonal Traverse**: Zigzag pattern

### Problem Archetypes

- Two Sum, Three Sum, Four Sum
- Best Time to Buy and Sell Stock (all variations)
- Container With Most Water
- Trapping Rain Water
- Product of Array Except Self
- Rotate Array
- Find Minimum in Rotated Sorted Array
- Search in Rotated Sorted Array
- Merge Intervals
- Insert Interval
- Maximum Subarray (Kadane's)
- Spiral Matrix
- Rotate Image
- Set Matrix Zeroes
- Longest Consecutive Sequence

### Python-Specific Considerations

- Lists are references: shallow copy with `arr[:]` or `arr.copy()`
- Deep copy needs `copy.deepcopy()`
- List comprehensions faster than loops
- `enumerate()` for index-value pairs
- Negative indices: `arr[-1]` is last element
- `bisect` module for binary search: `bisect_left()`, `bisect_right()`
- `*arr` unpacks list elements

---

## 3. Hash Maps / Dictionaries

### Overview

Hash maps provide O(1) average-case lookup, insertion, and deletion. Python's `dict` is an ordered hash map (as of Python 3.7+).

### Sub-topics

#### 3.1 Basic Operations

- **Creation**: `{}`, `dict()`, dict comprehension
- **Access**: `d[key]`, `d.get(key, default)`
- **Insertion**: `d[key] = value`
- **Deletion**: `del d[key]`, `d.pop(key)`
- **Iteration**: `d.items()`, `d.keys()`, `d.values()`

#### 3.2 Frequency Counting

- **Character Frequency**: Count occurrences in strings
- **Element Frequency**: Most common elements
- **Top K Frequent**: Using heap or bucket sort
- **Counter Class**: `collections.Counter` for counting

#### 3.3 Grouping Problems

- **Group Anagrams**: Hash by sorted string
- **Group by Property**: Custom hash function
- **Partition Labels**: Frequency-based grouping

#### 3.4 Two Sum Variations

- **Two Sum**: Hash map for complement lookup
- **Two Sum Sorted**: Two pointers alternative
- **Two Sum BST**: In-order + hash set
- **Two Sum Data Structure**: Design class

#### 3.5 Caching & Memoization

- **LRU Cache**: Ordered dict + doubly linked list
- **LFU Cache**: Frequency tracking with hash maps
- **Memoization Decorator**: `functools.lru_cache`
- **Custom Cache**: Implementing eviction policies

#### 3.6 Multi-Key Patterns

- **Nested Dictionaries**: `dict[key1][key2]`
- **Tuple Keys**: `(row, col)` as keys
- **Default Dict**: `collections.defaultdict(type)`
- **Maps of Lists**: `dict[key] = []`
- **Maps of Sets**: `dict[key] = set()`

#### 3.7 Prefix/Suffix Maps

- **Prefix Frequency**: Subarray sum problems
- **Running Sum Map**: Continuous subarray problems
- **Complement Maps**: Finding pairs with target

#### 3.8 Hash Design Problems

- **Design HashMap**: Implementing from scratch
- **Hash Function Design**: Collision handling
- **Separate Chaining**: Linked list at each bucket
- **Open Addressing**: Linear/quadratic probing

### Problem Archetypes

- Two Sum
- Group Anagrams
- Subarray Sum Equals K
- Continuous Subarray Sum
- Contains Duplicate, Contains Nearby Duplicate
- Longest Substring Without Repeating Characters
- Minimum Window Substring
- LRU Cache
- Design HashMap
- Top K Frequent Elements
- Valid Sudoku
- Isomorphic Strings
- Word Pattern

### Python-Specific Considerations

- `collections.defaultdict(list)` avoids key checking
- `collections.Counter` for frequency counting
- Dictionary comprehension: `{k: v for k, v in ...}`
- `dict.setdefault(key, default)` returns and sets
- Ordered insertion order preserved (Python 3.7+)
- `in` operator checks keys: `if key in d`
- `.get()` avoids KeyError exceptions

---

## 4. Sets

### Overview

Sets provide O(1) average membership testing, insertion, and deletion. Unordered collections of unique elements.

### Sub-topics

#### 4.1 Basic Operations

- **Creation**: `set()`, `{1, 2, 3}`
- **Add/Remove**: `add()`, `remove()`, `discard()`
- **Membership**: `x in s`
- **Set Comprehension**: `{x*2 for x in range(10)}`

#### 4.2 Set Operations

- **Union**: `a | b`, `a.union(b)`
- **Intersection**: `a & b`, `a.intersection(b)`
- **Difference**: `a - b`, `a.difference(b)`
- **Symmetric Difference**: `a ^ b`
- **Subset/Superset**: `a <= b`, `a >= b`

#### 4.3 Uniqueness & Deduplication

- **Remove Duplicates**: Convert list to set
- **Find Duplicates**: Set for seen elements
- **Single Number**: XOR or set difference

#### 4.4 Graph State Tracking

- **Visited Set**: Marking visited nodes in BFS/DFS
- **Path Tracking**: Current path in backtracking
- **Cycle Detection**: Detecting revisited nodes

#### 4.5 Mathematical Set Problems

- **Intersection Size**: Multiple arrays intersection
- **Union Size**: Counting unique across collections
- **Missing Number**: Using set complement
- **Find Difference**: Set difference operations

### Problem Archetypes

- Contains Duplicate
- Intersection of Two Arrays
- Happy Number
- Longest Consecutive Sequence
- Single Number
- Missing Number
- First Missing Positive

### Python-Specific Considerations

- `frozenset` for immutable sets (can be dict keys)
- Empty set: `set()` not `{}` (which creates dict)
- Sets are unordered: no indexing
- Fast membership testing: O(1) average
- Use for deduplication: `list(set(arr))`

---

## 5. Linked Lists

### Overview

Linked lists are sequential data structures with nodes containing data and next pointers. Efficient insertions/deletions but O(n) access.

### Sub-topics

#### 5.1 Linked List Types

- **Singly Linked List**: One next pointer
- **Doubly Linked List**: Next and prev pointers
- **Circular Linked List**: Last node points to first

#### 5.2 Basic Operations

- **Traversal**: Following next pointers
- **Insertion**: Head, tail, middle insertion
- **Deletion**: Removing nodes, updating pointers
- **Search**: Linear search through nodes

#### 5.3 Two-Pointer Techniques

- **Fast-Slow Pointers**: Finding middle, cycle detection
- **Floyd's Cycle Detection**: Tortoise and hare
- **Finding Cycle Start**: Mathematical approach
- **k-th Node from End**: Fast pointer k steps ahead

#### 5.4 Reversal

- **Iterative Reversal**: Three-pointer approach
- **Recursive Reversal**: Base case and recursion
- **Reverse in Groups**: Reversing k nodes at a time
- **Reverse Between Positions**: Partial reversal

#### 5.5 Merging & Sorting

- **Merge Two Sorted Lists**: Two-pointer merge
- **Merge K Sorted Lists**: Min heap approach
- **Sort List**: Merge sort on linked list
- **Insertion Sort List**: Building sorted list

#### 5.6 Cycle Problems

- **Detect Cycle**: Floyd's algorithm
- **Find Cycle Entry**: Two-phase detection
- **Remove Cycle**: Breaking the loop

#### 5.7 Intersection & Duplication

- **Intersection of Two Lists**: Length difference approach
- **Remove Duplicates**: Hash set or two pointers
- **Remove Nth Node from End**: Two-pointer approach

#### 5.8 Advanced Patterns

- **Reorder List**: Split, reverse, merge
- **Palindrome Linked List**: Reverse second half
- **Add Two Numbers**: Digit-by-digit addition
- **Partition List**: Rearranging around pivot
- **Flatten Multilevel List**: DFS or iterative

#### 5.9 Design Problems

- **Design Linked List**: Implementing from scratch
- **LRU Cache**: Doubly linked list + hash map
- **Skip List**: Probabilistic balanced structure

### Problem Archetypes

- Reverse Linked List
- Merge Two Sorted Lists
- Merge K Sorted Lists
- Linked List Cycle, Cycle II
- Intersection of Two Linked Lists
- Remove Nth Node From End
- Palindrome Linked List
- Reorder List
- Sort List
- Add Two Numbers
- Copy List with Random Pointer
- Flatten a Multilevel Doubly Linked List

### Python-Specific Considerations

- Define node class: `class ListNode: def __init__(self, val=0, next=None)`
- No built-in linked list (use custom implementation)
- Garbage collection handles deleted nodes
- Dummy head simplifies edge cases
- Check for `None` before accessing `.next`

---

## 6. Stacks & Queues

### Overview

Stacks (LIFO) and Queues (FIFO) are fundamental linear data structures. Python uses `list` for stacks and `collections.deque` for queues.

### Sub-topics

#### 6.1 Stack Operations

- **Push**: `stack.append(x)`
- **Pop**: `stack.pop()`
- **Peek**: `stack[-1]`
- **isEmpty**: `len(stack) == 0`

#### 6.2 Queue Operations

- **Enqueue**: `queue.append(x)`
- **Dequeue**: `queue.popleft()` (use `deque`)
- **Front**: `queue[0]`
- **isEmpty**: `len(queue) == 0`

#### 6.3 Monotonic Stack

- **Next Greater Element**: Maintaining decreasing stack
- **Next Smaller Element**: Maintaining increasing stack
- **Largest Rectangle in Histogram**: Stack for boundaries
- **Trapping Rain Water**: Using stack for water levels
- **Maximum Width Ramp**: Stack preprocessing

#### 6.4 Expression Evaluation

- **Valid Parentheses**: Stack matching brackets
- **Balanced Brackets**: Multiple types validation
- **Evaluate Postfix**: Stack-based calculation
- **Evaluate Prefix**: Reverse postfix approach
- **Infix to Postfix**: Shunting yard algorithm
- **Basic Calculator**: Handling operations and parentheses

#### 6.5 Stack-Based Parsing

- **Decode String**: Nested bracket expansion
- **Tag Validator**: XML/HTML validation
- **Remove K Digits**: Greedy stack approach
- **Remove Duplicate Letters**: Stack with seen set

#### 6.6 Sliding Window Maximum

- **Using Deque**: Maintaining window maximum indices
- **Monotonic Deque**: Removing useless elements

#### 6.7 BFS with Queue

- **Level-Order Traversal**: Tree/graph BFS
- **Shortest Path**: Unweighted graph BFS
- **Word Ladder**: BFS with transformations
- **Rotting Oranges**: Multi-source BFS

#### 6.8 Design Problems

- **Min Stack**: Stack with O(1) minimum
- **Max Stack**: Stack with O(1) maximum
- **Implement Queue using Stacks**: Two-stack approach
- **Implement Stack using Queues**: Two-queue approach

### Problem Archetypes

- Valid Parentheses
- Min Stack, Max Stack
- Daily Temperatures
- Next Greater Element I, II
- Largest Rectangle in Histogram
- Trapping Rain Water
- Evaluate Reverse Polish Notation
- Basic Calculator I, II, III
- Decode String
- Remove K Digits
- Sliding Window Maximum
- Implement Queue using Stacks

### Python-Specific Considerations

- Use `list` for stack: `append()` and `pop()` are O(1)
- Use `collections.deque` for queue: `popleft()` is O(1)
- `list.pop(0)` is O(n), avoid for queue
- `queue.Queue` is thread-safe but slower
- Deque supports both ends: `appendleft()`, `popright()`

---

## 7. Heaps / Priority Queues

### Overview

Heaps maintain partial order for efficient minimum/maximum retrieval. Python's `heapq` implements min-heap.

### Sub-topics

#### 7.1 Heap Operations

- **heappush**: `heapq.heappush(heap, item)` - O(log n)
- **heappop**: `heapq.heappop(heap)` - O(log n)
- **heapify**: `heapq.heapify(list)` - O(n)
- **heappushpop**: Combined push then pop
- **heapreplace**: Combined pop then push

#### 7.2 K-th Element Problems

- **K-th Largest**: Min-heap of size k
- **K-th Smallest**: Max-heap of size k (negate values)
- **Find Median**: Two heaps (max-heap + min-heap)
- **Top K Frequent Elements**: Heap or bucket sort

#### 7.3 Merging Problems

- **Merge K Sorted Lists**: Min-heap of list heads
- **Merge K Sorted Arrays**: Similar approach
- **Smallest Range**: Tracking minimums across lists

#### 7.4 Scheduling & Intervals

- **Meeting Rooms II**: Min-heap for end times
- **Task Scheduler**: Frequency-based scheduling
- **CPU Scheduling**: Priority queue simulation
- **Course Schedule III**: Greedy with heap

#### 7.5 Graph Algorithms

- **Dijkstra's Algorithm**: Min-heap for shortest paths
- **Prim's Algorithm**: Min-heap for MST
- **A\* Search**: Priority queue with heuristic

#### 7.6 Streaming Data

- **Running Median**: Two-heap approach
- **Sliding Window Median**: Lazy deletion heaps
- **Top K in Stream**: Maintaining size-k heap

#### 7.7 Two-Heap Pattern

- **Max-Heap + Min-Heap**: Median finding
- **Balance Maintenance**: Rebalancing heaps

### Problem Archetypes

- K-th Largest Element in Array
- Top K Frequent Elements
- Find Median from Data Stream
- Merge K Sorted Lists
- Meeting Rooms II
- Task Scheduler
- Reorganize String
- Smallest Range Covering Elements from K Lists
- Kth Smallest Element in Sorted Matrix
- Ugly Number II

### Python-Specific Considerations

- `heapq` is min-heap only: negate for max-heap
- Heap is a list: `heap[0]` is minimum
- Custom comparisons: use tuple `(priority, data)`
- For objects: implement `__lt__` method
- Lazy deletion: mark as deleted, skip during pop
- `nlargest()` and `nsmallest()` for top-k

---

## 8. Trees

### Overview

Trees are hierarchical data structures with nodes containing data and child pointers. Binary trees are most common in interviews.

### Sub-topics

#### 8.1 Tree Types

- **Binary Tree**: At most 2 children per node
- **Binary Search Tree (BST)**: Left < root < right
- **Balanced Trees**: AVL, Red-Black (conceptual)
- **Complete Binary Tree**: All levels filled except last
- **Perfect Binary Tree**: All internal nodes have 2 children
- **N-ary Tree**: Multiple children per node
- **Trie**: Prefix tree for string storage

#### 8.2 Tree Traversal

- **Inorder (LNR)**: Left, node, right (BST gives sorted)
- **Preorder (NLR)**: Node, left, right
- **Postorder (LRN)**: Left, right, node
- **Level-Order (BFS)**: Level by level using queue
- **Iterative Traversals**: Using stack explicitly
- **Morris Traversal**: O(1) space using threading

#### 8.3 Recursive Patterns

- **Top-Down Recursion**: Passing info to children
- **Bottom-Up Recursion**: Returning info to parent
- **Divide and Conquer**: Processing subtrees independently
- **Path-Based Recursion**: Tracking path state

#### 8.4 Tree Properties

- **Height/Depth**: Distance to farthest leaf
- **Diameter**: Longest path between leaves
- **Balanced Check**: Height difference constraint
- **Complete Tree Check**: Level-order validation
- **Symmetric Tree**: Mirror structure check
- **Same Tree**: Structural and value equality

#### 8.5 Binary Search Tree (BST)

- **Search**: O(log n) average, O(n) worst
- **Insert**: Maintaining BST property
- **Delete**: Handling 0, 1, 2 child cases
- **Validate BST**: Checking order property
- **Inorder Successor/Predecessor**: Next/previous in sorted order
- **Lowest Common Ancestor**: Path-based search
- **Kth Smallest**: Inorder with counter

#### 8.6 Path Problems

- **Root to Leaf Paths**: All paths enumeration
- **Path Sum**: Finding paths with target sum
- **Path Sum II**: Returning all valid paths
- **Path Sum III**: Paths not starting at root
- **Maximum Path Sum**: Considering all paths
- **Binary Tree Paths**: String representation

#### 8.7 Ancestors & Descendants

- **Lowest Common Ancestor (LCA)**: Finding common ancestor
- **Distance Between Nodes**: Path computation
- **All Nodes Distance K**: BFS from target

#### 8.8 Construction & Transformation

- **Build from Traversals**: Inorder + Preorder/Postorder
- **Serialize/Deserialize**: String encoding/decoding
- **Flatten to Linked List**: Preorder flattening
- **Invert Binary Tree**: Swapping children
- **Convert Sorted Array to BST**: Recursive construction

#### 8.9 Advanced Tree Operations

- **Subtree of Another Tree**: Pattern matching
- **Count Complete Tree Nodes**: Binary search on levels
- **Recover BST**: Two swapped nodes
- **Trim BST**: Removing out-of-range nodes
- **Merge Two Binary Trees**: Overlapping sums

#### 8.10 N-ary Trees

- **Traversal**: Preorder, postorder, level-order
- **Serialization**: Encoding variable children
- **Maximum Depth**: Recursive height
- **Diameter**: Path through root

#### 8.11 Tries (Prefix Trees)

- **Insert**: Character-by-character
- **Search**: Exact word lookup
- **Prefix Search**: Checking prefix existence
- **Word Break**: Using trie for dictionary
- **Design Add and Search Words**: Wildcard support
- **Replace Words**: Prefix replacement

### Problem Archetypes

- Maximum Depth of Binary Tree
- Invert Binary Tree
- Symmetric Tree
- Validate Binary Search Tree
- Lowest Common Ancestor
- Binary Tree Level Order Traversal
- Binary Tree Right Side View
- Construct Binary Tree from Traversals
- Path Sum, Path Sum II, Path Sum III
- Binary Tree Maximum Path Sum
- Serialize and Deserialize Binary Tree
- Kth Smallest Element in BST
- Flatten Binary Tree to Linked List
- Implement Trie
- Word Search II (Trie + Backtracking)

### Python-Specific Considerations

- Define node: `class TreeNode: def __init__(self, val=0, left=None, right=None)`
- Recursion depth limit: ~1000 (use `sys.setrecursionlimit()` cautiously)
- Use deque for level-order: `collections.deque()`
- `None` represents null nodes
- Pass state via parameters or use nonlocal variables

---

## 9. Graphs

### Overview

Graphs represent relationships between entities. Can be directed/undirected, weighted/unweighted, represented as adjacency list/matrix.

### Sub-topics

#### 9.1 Graph Representation

- **Adjacency List**: `{node: [neighbors]}`
- **Adjacency Matrix**: 2D array of connections
- **Edge List**: List of `(u, v)` pairs
- **Implicit Graphs**: Grid, state space

#### 9.2 Graph Traversal

- **Depth-First Search (DFS)**: Stack-based or recursive
- **Breadth-First Search (BFS)**: Queue-based level exploration
- **Iterative DFS**: Using explicit stack
- **Recursive DFS**: Call stack for traversal

#### 9.3 Connectivity

- **Connected Components**: DFS/BFS on unvisited nodes
- **Number of Islands**: Grid DFS/BFS
- **Friend Circles**: Component counting
- **Strongly Connected Components**: Kosaraju's, Tarjan's
- **Articulation Points**: Critical nodes
- **Bridges**: Critical edges

#### 9.4 Cycle Detection

- **Undirected Graph**: DFS with parent tracking
- **Directed Graph**: DFS with recursion stack
- **Course Schedule**: Detecting cycles in DAG
- **Union-Find**: For undirected cycle detection

#### 9.5 Topological Sort

- **Kahn's Algorithm**: BFS with in-degree
- **DFS-Based**: Post-order traversal
- **Course Schedule II**: Producing valid order
- **Alien Dictionary**: Building order from words

#### 9.6 Shortest Path

- **BFS (Unweighted)**: Level-order shortest path
- **Dijkstra's Algorithm**: Min-heap for weighted graphs
- **Bellman-Ford**: Handling negative weights
- **Floyd-Warshall**: All-pairs shortest paths
- **A\* Search**: Heuristic-guided search

#### 9.7 Minimum Spanning Tree

- **Prim's Algorithm**: Heap-based greedy
- **Kruskal's Algorithm**: Union-Find with sorted edges

#### 9.8 Union-Find (Disjoint Set)

- **Find with Path Compression**: Finding root
- **Union by Rank/Size**: Merging sets
- **Connected Components**: Dynamic connectivity
- **Redundant Connection**: Cycle detection
- **Number of Provinces**: Component counting

#### 9.9 Bipartite Graphs

- **Two-Coloring**: BFS/DFS with colors
- **Is Graph Bipartite**: Checking 2-colorability
- **Possible Bipartition**: Conflict checking

#### 9.10 Grid Graphs

- **Matrix as Graph**: 4 or 8 directions
- **Number of Islands**: Component counting
- **Max Area of Island**: DFS with area tracking
- **Surrounded Regions**: Boundary-based DFS
- **Word Search**: Backtracking on grid
- **Shortest Path in Binary Matrix**: BFS

#### 9.11 State Space Graphs

- **Word Ladder**: BFS on word transformations
- **Open the Lock**: BFS with state encoding
- **Sliding Puzzle**: BFS on configurations

#### 9.12 Advanced Graph Problems

- **Clone Graph**: DFS/BFS with hash map
- **Reconstruct Itinerary**: Euler path
- **Minimum Height Trees**: Topological sort variation
- **Network Delay Time**: Dijkstra's application
- **Cheapest Flights K Stops**: Modified BFS/Dijkstra

### Problem Archetypes

- Number of Islands
- Clone Graph
- Course Schedule, Course Schedule II
- Pacific Atlantic Water Flow
- Graph Valid Tree
- Number of Connected Components
- Word Ladder
- Network Delay Time
- Cheapest Flights Within K Stops
- Reconstruct Itinerary
- Critical Connections in a Network
- Is Graph Bipartite
- Redundant Connection
- Minimum Height Trees

### Python-Specific Considerations

- Use `collections.defaultdict(list)` for adjacency list
- Use `set` for visited tracking
- Use `deque` for BFS queue
- Grid indexing: `grid[row][col]`
- Direction arrays: `dirs = [(0,1), (1,0), (0,-1), (-1,0)]`
- Hash tuples for coordinates: `(row, col)` as keys

---

## 10. Recursion & Backtracking

### Overview

Recursion solves problems by breaking into smaller subproblems. Backtracking explores solution space by making choices and undoing them.

### Sub-topics

#### 10.1 Recursion Fundamentals

- **Base Case**: Termination condition
- **Recursive Case**: Self-reference with smaller input
- **Call Stack**: Function call memory
- **Tail Recursion**: Optimization opportunity

#### 10.2 Backtracking Framework

- **Choose**: Make a choice
- **Explore**: Recurse with choice
- **Unchoose**: Undo choice (backtrack)
- **Pruning**: Early termination of invalid paths

#### 10.3 Permutations

- **Full Permutations**: All arrangements
- **Permutations with Duplicates**: Handling repeated elements
- **Next Permutation**: Lexicographic next
- **Permutation Sequence**: k-th permutation

#### 10.4 Combinations

- **Combinations**: Choosing k elements
- **Combination Sum**: Elements summing to target
- **Combination Sum II**: With duplicates
- **Combination Sum III**: Fixed number of elements

#### 10.5 Subsets

- **Subsets**: All possible subsets (power set)
- **Subsets II**: With duplicate elements
- **Iterative Approach**: Building subsets incrementally
- **Bit Manipulation**: Using binary representation

#### 10.6 Constraint Satisfaction

- **N-Queens**: Placing queens on chessboard
- **Sudoku Solver**: Filling valid sudoku
- **Valid Parentheses Generation**: Generating balanced parens
- **Word Search**: Finding words in grid

#### 10.7 Partitioning

- **Palindrome Partitioning**: All palindrome splits
- **Partition to K Equal Sum Subsets**: Subset division
- **Split Array into Consecutive Subsequences**: Sequence building

#### 10.8 Path Finding

- **All Paths from Source to Target**: DAG traversal
- **Unique Paths**: Grid navigation
- **Letter Combinations**: Phone number mapping
- **Binary Watch**: Time generation

#### 10.9 Decision Trees

- **Expression Add Operators**: Placing operators
- **Remove Invalid Parentheses**: Minimum removals
- **Restore IP Addresses**: Valid IP splitting

### Problem Archetypes

- Subsets, Subsets II
- Permutations, Permutations II
- Combination Sum I, II, III
- Generate Parentheses
- N-Queens, N-Queens II
- Sudoku Solver
- Word Search
- Palindrome Partitioning
- Letter Combinations of Phone Number
- Restore IP Addresses
- Expression Add Operators

### Python-Specific Considerations

- Default recursion limit: ~1000 (use `sys.setrecursionlimit()`)
- Pass lists by reference: use `path[:]` for copies
- Use `nonlocal` for modifying outer variables
- `functools.lru_cache` for memoization
- List methods modify in-place: `append()`, `pop()`

---

## 11. Dynamic Programming (DP)

### Overview

DP solves problems by breaking into overlapping subproblems, storing solutions to avoid recomputation.

### Sub-topics

#### 11.1 DP Fundamentals

- **Overlapping Subproblems**: Repeated calculations
- **Optimal Substructure**: Optimal solution from subproblems
- **Memoization (Top-Down)**: Recursive with cache
- **Tabulation (Bottom-Up)**: Iterative table filling
- **State Definition**: Identifying DP state
- **Transition**: Relating states

#### 11.2 1-D DP

- **Fibonacci**: Classic example
- **Climbing Stairs**: Number of ways
- **House Robber**: Maximum non-adjacent sum
- **Decode Ways**: String decoding count
- **Jump Game**: Reachability check
- **Maximum Subarray**: Kadane's algorithm

#### 11.3 2-D DP

- **Unique Paths**: Grid navigation
- **Minimum Path Sum**: Grid sum minimization
- **Longest Common Subsequence (LCS)**: String comparison
- **Edit Distance**: Minimum operations
- **Regular Expression Matching**: Pattern matching
- **Wildcard Matching**: With \* and ?
- **Interleaving String**: Merging validation

#### 11.4 Knapsack Problems

- **0/1 Knapsack**: Include or exclude items
- **Unbounded Knapsack**: Unlimited items
- **Partition Equal Subset Sum**: Subset division
- **Target Sum**: Assignment of signs
- **Coin Change**: Minimum coins for amount
- **Coin Change II**: Number of ways

#### 11.5 Subsequence Problems

- **Longest Increasing Subsequence (LIS)**: O(n²) and O(n log n)
- **Longest Common Subsequence (LCS)**: Two sequences
- **Longest Palindromic Subsequence**: Within string
- **Maximum Length of Repeated Subarray**: Contiguous common
- **Distinct Subsequences**: Count of occurrences

#### 11.6 String DP

- **Palindrome Substring**: Longest, count
- **Palindrome Partitioning**: Minimum cuts
- **Word Break**: Dictionary decomposition
- **Word Break II**: All decompositions
- **Scramble String**: Tree structure matching

#### 11.7 Interval DP

- **Burst Balloons**: Optimal balloon popping
- **Merge Stones**: Minimum cost merging
- **Minimum Cost Tree From Leaf Values**: Tree construction
- **Palindrome Removal**: Minimum steps

#### 11.8 Tree DP

- **Binary Tree Maximum Path Sum**: Paths through nodes
- **House Robber III**: Tree structure
- **Longest Univalue Path**: Same value paths
- **Diameter of Binary Tree**: Longest path

#### 11.9 State Machine DP

- **Best Time to Buy and Sell Stock**: With states
- **Best Time to Buy and Sell Stock with Cooldown**: State transitions
- **Best Time to Buy and Sell Stock with Fee**: Transaction costs

#### 11.10 Digit DP

- **Count Numbers with Unique Digits**: Digit constraints
- **Numbers At Most N Given Digit Set**: Building numbers

#### 11.11 Bitmask DP

- **Travelling Salesman Problem (TSP)**: Visiting all nodes
- **Partition to K Equal Sum Subsets**: Subset tracking
- **Shortest Path Visiting All Nodes**: State with visited set

#### 11.12 Game Theory DP

- **Stone Game**: Optimal play
- **Predict the Winner**: Two-player games
- **Can I Win**: Winning strategy

### Problem Archetypes

- Climbing Stairs
- House Robber I, II, III
- Coin Change, Coin Change II
- Longest Increasing Subsequence
- Longest Common Subsequence
- Edit Distance
- Unique Paths, Unique Paths II
- Minimum Path Sum
- Triangle (path sum)
- Maximum Subarray
- Jump Game, Jump Game II
- Decode Ways
- Word Break, Word Break II
- Partition Equal Subset Sum
- Target Sum
- Longest Palindromic Substring
- Palindrome Partitioning II
- Regular Expression Matching
- Wildcard Matching
- Burst Balloons

### Python-Specific Considerations

- Use lists for 1-D: `dp = [0] * n`
- Use nested lists for 2-D: `dp = [[0] * m for _ in range(n)]`
- Don't use `[[0] * m] * n` (shallow copy issue)
- `functools.lru_cache` for top-down memoization
- Use dictionaries for sparse state spaces
- `float('inf')` for initialization

---

## 12. Greedy Algorithms

### Overview

Greedy makes locally optimal choices hoping to find global optimum. Works when problem has optimal substructure and greedy choice property.

### Sub-topics

#### 12.1 Greedy Fundamentals

- **Greedy Choice Property**: Local optimum leads to global
- **Proof of Correctness**: Exchange argument, stay ahead
- **Counterexamples**: When greedy fails

#### 12.2 Interval Problems

- **Activity Selection**: Maximum non-overlapping
- **Merge Intervals**: Combining overlaps
- **Non-overlapping Intervals**: Minimum removals
- **Meeting Rooms II**: Minimum rooms needed
- **Interval Covering**: Minimum intervals to cover

#### 12.3 Array Greedy

- **Jump Game**: Can reach end
- **Jump Game II**: Minimum jumps
- **Gas Station**: Circuit completion
- **Candy**: Distribution with constraints
- **Assign Cookies**: Content children

#### 12.4 String Greedy

- **Remove K Digits**: Smallest number
- **Remove Duplicate Letters**: Lexicographically smallest
- **Partition Labels**: Maximum partition size

#### 12.5 Two-Pointer Greedy

- **Container With Most Water**: Maximum area
- **Trapping Rain Water**: Water between bars
- **3Sum Closest**: Closest sum to target

#### 12.6 Scheduling

- **Task Scheduler**: Minimum time with cooldown
- **Course Schedule III**: Maximum courses
- **Minimum Number of Arrows**: Overlapping balloons

### Problem Archetypes

- Jump Game, Jump Game II
- Gas Station
- Candy
- Non-overlapping Intervals
- Merge Intervals
- Partition Labels
- Queue Reconstruction by Height
- Lemonade Change
- Task Scheduler

### Python-Specific Considerations

- Sort with custom key: `sorted(arr, key=lambda x: ...)`
- Multiple criteria: `key=lambda x: (x[0], -x[1])`
- Use heaps for greedy selection

---

## 13. Binary Search

### Overview

Binary search efficiently finds elements in sorted data by repeatedly halving search space. O(log n) time complexity.

### Sub-topics

#### 13.1 Standard Binary Search

- **Finding Element**: Exact match in sorted array
- **Lower Bound**: First element ≥ target
- **Upper Bound**: First element > target
- **Insert Position**: Where to insert target

#### 13.2 Search Space Variations

- **Rotated Sorted Array**: Modified binary search
- **Search in 2D Matrix**: Row then column search
- **Peak Element**: Finding local maximum
- **Single Element in Sorted Array**: XOR patterns

#### 13.3 Binary Search on Answer

- **Capacity To Ship Packages**: Minimizing capacity
- **Koko Eating Bananas**: Finding eating speed
- **Minimum Time to Complete Trips**: Time calculation
- **Split Array Largest Sum**: Minimizing maximum

#### 13.4 Matrix Binary Search

- **Search 2D Matrix**: Sorted rows and columns
- **Kth Smallest in Sorted Matrix**: Binary search on value range

#### 13.5 Advanced Patterns

- **Median of Two Sorted Arrays**: Partition approach
- **Find K-th Smallest Pair Distance**: Binary search + counting

### Problem Archetypes

- Binary Search
- Search in Rotated Sorted Array
- Find First and Last Position
- Search Insert Position
- Find Peak Element
- Sqrt(x)
- Valid Perfect Square
- Median of Two Sorted Arrays
- Koko Eating Bananas
- Capacity To Ship Packages

### Python-Specific Considerations

- `bisect_left()`: Lower bound
- `bisect_right()`: Upper bound
- Avoid integer overflow (not issue in Python)
- Use `mid = left + (right - left) // 2` or `(left + right) // 2`

---

## 14. Math & Number Theory

### Overview

Mathematical problems involving number properties, arithmetic operations, and theoretical concepts.

### Sub-topics

#### 14.1 Basic Arithmetic

- **GCD/LCM**: Euclidean algorithm
- **Prime Numbers**: Sieve of Eratosthenes
- **Prime Factorization**: Decomposition
- **Perfect Square**: Checking and finding

#### 14.2 Modular Arithmetic

- **Modulo Operations**: (a + b) % m, (a \* b) % m
- **Modular Exponentiation**: Fast power algorithm
- **Modular Inverse**: Fermat's theorem, extended Euclidean

#### 14.3 Combinatorics

- **Factorial**: n!
- **Combinations**: nCr = n! / (r! \* (n-r)!)
- **Permutations**: nPr = n! / (n-r)!
- **Pascal's Triangle**: Binomial coefficients
- **Catalan Numbers**: Parenthesization, BSTs

#### 14.4 Number Properties

- **Even/Odd**: Parity checks
- **Digits**: Extracting, summing, counting
- **Palindrome Number**: Reversing comparison
- **Ugly Numbers**: Factorization constraints
- **Happy Number**: Digit square sum cycles

#### 14.5 Sequences

- **Fibonacci**: Recursion, DP, matrix exponentiation
- **Arithmetic Progression**: Sum formulas
- **Geometric Progression**: Sum formulas
- **Power of Two/Three**: Bit manipulation, division

#### 14.6 Geometry (Basic)

- **Distance**: Euclidean distance
- **Line Intersection**: Coordinate geometry
- **Convex Hull**: Graham scan, Jarvis march
- **Rectangle Overlap**: Coordinate comparison

### Problem Archetypes

- Pow(x, n)
- Sqrt(x)
- Excel Sheet Column Number
- Factorial Trailing Zeroes
- Count Primes
- Happy Number
- Ugly Number, Ugly Number II
- Perfect Squares
- Integer to Roman, Roman to Integer
- Multiply Strings
- Add Binary

### Python-Specific Considerations

- No integer overflow (arbitrary precision)
- `math` module: `gcd()`, `sqrt()`, `factorial()`
- `pow(base, exp, mod)` for modular exponentiation
- `divmod(a, b)` returns quotient and remainder
- Use `Decimal` for precise decimal arithmetic

---

## 15. Bit Manipulation

### Overview

Bit manipulation operates directly on binary representations. Efficient for certain problems using bitwise operators.

### Sub-topics

#### 15.1 Bitwise Operators

- **AND (&)**: Both bits 1
- **OR (|)**: At least one bit 1
- **XOR (^)**: Exactly one bit 1
- **NOT (~)**: Flips bits
- **Left Shift (<<)**: Multiply by 2
- **Right Shift (>>)**: Divide by 2

#### 15.2 Common Bit Tricks

- **Check i-th bit**: `(n >> i) & 1`
- **Set i-th bit**: `n | (1 << i)`
- **Clear i-th bit**: `n & ~(1 << i)`
- **Toggle i-th bit**: `n ^ (1 << i)`
- **Clear lowest set bit**: `n & (n - 1)`
- **Get lowest set bit**: `n & -n`
- **Count set bits**: Brian Kernighan's algorithm

#### 15.3 XOR Patterns

- **Single Number**: XOR all elements
- **Two Single Numbers**: XOR grouping
- **Missing Number**: XOR with indices
- **Self-cancellation**: a ^ a = 0

#### 15.4 Bit Counting

- **Number of 1 Bits**: Hamming weight
- **Counting Bits**: DP with bit patterns
- **Power of Two**: n & (n - 1) == 0

#### 15.5 Subset Generation

- **All Subsets**: Iterate 0 to 2^n - 1
- **Subset Sum**: Bitmask DP

#### 15.6 Bitset Applications

- **State Encoding**: Representing state in bits
- **Visited Tracking**: Bit flags
- **Optimization**: Space-efficient storage

### Problem Archetypes

- Single Number I, II, III
- Number of 1 Bits
- Counting Bits
- Reverse Bits
- Power of Two, Power of Four
- Missing Number
- Bitwise AND of Numbers Range
- Maximum XOR of Two Numbers
- Sum of Two Integers (without + operator)

### Python-Specific Considerations

- Integers have unlimited precision
- Negative numbers: two's complement
- Bitwise NOT: `~n` gives -(n+1)
- No unsigned integers
- `bin(n)` converts to binary string
- `int(s, 2)` parses binary string

---

## 16. Sorting & Searching Algorithms

### Overview

Comprehensive sorting and searching techniques beyond basic implementations.

### Sub-topics

#### 16.1 Comparison-Based Sorting

- **Bubble Sort**: O(n²), stable
- **Selection Sort**: O(n²), unstable
- **Insertion Sort**: O(n²), stable, good for small/nearly sorted
- **Merge Sort**: O(n log n), stable, divide and conquer
- **Quick Sort**: O(n log n) average, in-place partitioning
- **Heap Sort**: O(n log n), in-place using heap

#### 16.2 Non-Comparison Sorting

- **Counting Sort**: O(n + k), for limited range
- **Radix Sort**: O(d \* (n + k)), digit-based
- **Bucket Sort**: O(n + k), distribution-based

#### 16.3 Partial Sorting

- **Quick Select**: O(n) average for k-th element
- **Top K Elements**: Heap-based selection

#### 16.4 Custom Sorting

- **Custom Comparator**: Lambda functions, key functions
- **Multi-Key Sorting**: Tuple sorting
- **Stable Sort**: Maintaining relative order

#### 16.5 Searching Algorithms

- **Linear Search**: O(n)
- **Binary Search**: O(log n) on sorted
- **Interpolation Search**: O(log log n) for uniform distribution
- **Exponential Search**: For unbounded arrays

### Problem Archetypes

- Sort an Array
- Sort Colors (Dutch National Flag)
- Merge Sorted Array
- Sort List (Linked List)
- Largest Number (custom comparator)
- K Closest Points to Origin
- Top K Frequent Elements
- Wiggle Sort, Wiggle Sort II

### Python-Specific Considerations

- `sorted()` returns new list, `list.sort()` in-place
- Timsort: Hybrid of merge and insertion sort
- `key` parameter for custom sorting
- `functools.cmp_to_key()` for comparison functions
- `reverse=True` for descending order
- Stable sorting guaranteed

---

## 17. Two Pointers & Sliding Window (Advanced)

### Overview

Advanced patterns using multiple pointers for efficient array/string processing. These techniques optimize brute force O(n²) or O(n³) solutions to O(n) or O(n log n).

### Sub-topics

#### 17.1 Two Pointers - Opposite Direction

- **Palindrome Validation**: Left and right converging
- **Two Sum in Sorted Array**: Adjusting sum with pointers
- **Container With Most Water**: Maximizing area
- **Valid Palindrome with Deletions**: Allowing k deletions
- **Reverse String/Array**: In-place swapping

#### 17.2 Two Pointers - Same Direction

- **Fast-Slow Pointers**: Different speeds
- **Remove Duplicates**: Write pointer behind read pointer
- **Move Zeros**: Partitioning while maintaining order
- **Partition Array**: Separating by condition
- **Merge Sorted Arrays**: Two arrays into one

#### 17.3 Three Pointers

- **3Sum**: Fixed pointer + two-pointer pairs
- **3Sum Closest**: Minimizing distance to target
- **4Sum**: Nested three-pointer approach
- **Dutch National Flag**: Three-way partitioning
- **Sort Colors**: 0s, 1s, 2s sorting

#### 17.4 Fixed-Size Sliding Window

- **Maximum Sum Subarray of Size K**: Simple sliding
- **First Negative in Window**: Queue-based tracking
- **Count Anagrams**: Fixed-size frequency matching
- **Sliding Window Maximum**: Deque optimization

#### 17.5 Variable-Size Sliding Window

- **Longest Substring Without Repeating**: Expanding and contracting
- **Longest Substring with K Distinct**: Frequency map + window
- **Minimum Window Substring**: Shrinking to minimum
- **Fruits Into Baskets**: At most K distinct elements
- **Subarray Product Less Than K**: Multiplicative constraint

#### 17.6 Window with Frequency Map

- **Character Frequency Tracking**: Using hash map
- **Anagram Finding**: Matching frequency patterns
- **Permutation in String**: Checking window match
- **Find All Anagrams**: Collecting all matches

#### 17.7 Window Optimization Techniques

- **Monotonic Deque**: For window min/max in O(1)
- **Lazy Deletion**: Marking stale elements
- **Two-Pass Window**: Preprocessing for efficiency
- **Cumulative State**: Prefix sums with window

#### 17.8 Advanced Window Patterns

- **Subarray Sum Equals K**: Prefix sum + hash map
- **Continuous Subarray Sum**: Modulo arithmetic
- **Maximum Size Subarray Sum Equals K**: Longest window
- **Minimum Operations to Reduce X to Zero**: Two-side window
- **Replace Substring for Balanced String**: Complement window

#### 17.9 Multi-Array Two Pointers

- **Merge K Sorted Arrays**: Heap or multi-pointer
- **Intersection of Multiple Arrays**: Pointer per array
- **Median of Two Sorted Arrays**: Binary search + pointers

#### 17.10 Cyclic/Circular Window

- **Maximum Sum Circular Subarray**: Handle wrap-around
- **Circular Array Loop**: Detecting cycles in circular structure

### Problem Archetypes

- Two Sum II (sorted array)
- 3Sum, 3Sum Closest, 4Sum
- Container With Most Water
- Trapping Rain Water
- Remove Duplicates from Sorted Array
- Longest Substring Without Repeating Characters
- Minimum Window Substring
- Longest Substring with At Most K Distinct Characters
- Find All Anagrams in String
- Permutation in String
- Sliding Window Maximum
- Minimum Size Subarray Sum
- Subarray Product Less Than K
- Fruit Into Baskets
- Max Consecutive Ones III

### Python-Specific Considerations

- Use `collections.Counter` for frequency tracking
- `collections.deque` for efficient window operations
- Dictionary `.get(key, 0)` to avoid KeyError
- Window state updates: increment/decrement counts
- Use sets for "seen" tracking in substring problems
- `defaultdict(int)` for automatic zero initialization

---

## 18. File Handling (Python-Specific)

### Overview

File I/O operations for reading, writing, and processing files. Essential for data processing, log analysis, and configuration management in real-world applications.

### Sub-topics

#### 18.1 Basic File Operations

- **Opening Files**: `open(filename, mode)`
- **Modes**: 'r' (read), 'w' (write), 'a' (append), 'rb' (binary read)
- **Context Manager**: `with open() as f:` for automatic closing
- **Reading**: `read()`, `readline()`, `readlines()`
- **Writing**: `write()`, `writelines()`
- **Closing**: `f.close()` (automatic with context manager)

#### 18.2 Reading Files

- **Read Entire File**: `content = f.read()`
- **Read Line by Line**: `for line in f:`
- **Read Lines into List**: `lines = f.readlines()`
- **Read Specific Bytes**: `f.read(n)`
- **Read with Strip**: `line.strip()` to remove newlines

#### 18.3 Writing Files

- **Write String**: `f.write(string)`
- **Write Lines**: `f.writelines(list_of_strings)`
- **Append Mode**: Adding to existing file
- **Overwrite Mode**: Clearing and writing
- **Flush Buffer**: `f.flush()` for immediate write

#### 18.4 Large File Handling

- **Line-by-Line Processing**: Memory-efficient iteration
- **Chunked Reading**: `f.read(chunk_size)` in loop
- **Generator Functions**: Yielding lines lazily
- **Buffered Reading**: Using buffer size parameter
- **Memory Mapping**: `mmap` for large files

#### 18.5 Structured Data Parsing

- **CSV Files**: Using `csv` module
  - `csv.reader()`: Reading CSV rows
  - `csv.DictReader()`: Reading as dictionaries
  - `csv.writer()`: Writing CSV rows
  - `csv.DictWriter()`: Writing from dictionaries
- **JSON Files**: Using `json` module
  - `json.load()`: Parse JSON from file
  - `json.dump()`: Write JSON to file
  - `json.loads()`: Parse JSON string
  - `json.dumps()`: Convert to JSON string
- **XML/HTML**: Using `xml.etree.ElementTree` or `BeautifulSoup`
- **YAML**: Using `pyyaml` library (if available)

#### 18.6 File Path Operations

- **Path Manipulation**: Using `os.path` or `pathlib`
  - `os.path.join()`: Building paths
  - `os.path.exists()`: Checking existence
  - `os.path.isfile()`: Checking if file
  - `os.path.isdir()`: Checking if directory
  - `os.path.basename()`: Getting filename
  - `os.path.dirname()`: Getting directory
- **Pathlib**: Modern path handling
  - `Path(filename)`: Creating path object
  - `path.exists()`, `path.is_file()`, `path.is_dir()`
  - `path.read_text()`, `path.write_text()`

#### 18.7 Directory Operations

- **List Files**: `os.listdir(path)`, `path.iterdir()`
- **Walk Directory Tree**: `os.walk(path)`
- **Create Directory**: `os.mkdir()`, `os.makedirs()`
- **Remove Directory**: `os.rmdir()`, `shutil.rmtree()`
- **Glob Patterns**: `glob.glob('*.txt')` for pattern matching

#### 18.8 Error Handling

- **FileNotFoundError**: Handle missing files
- **PermissionError**: Handle access denied
- **IOError**: General I/O errors
- **Try-Except-Finally**: Proper cleanup
- **Context Manager**: Automatic error handling

#### 18.9 Binary File Operations

- **Reading Binary**: Mode 'rb'
- **Writing Binary**: Mode 'wb'
- **Byte Operations**: Working with bytes objects
- **Struct Module**: Packing/unpacking binary data
- **Pickle**: Serializing Python objects

#### 18.10 File Processing Patterns

- **Line Counting**: Iterating and counting
- **Word Frequency**: Dictionary for counts
- **Log File Analysis**: Pattern matching and aggregation
- **Data Transformation**: Read, process, write
- **File Merging**: Combining multiple files
- **File Splitting**: Dividing large files

#### 18.11 Temporary Files

- **tempfile Module**: Creating temporary files
- **TemporaryFile**: Auto-deleted file object
- **NamedTemporaryFile**: Temporary with filename
- **TemporaryDirectory**: Temporary directory

#### 18.12 File Compression

- **gzip Module**: GZIP compression
- **zipfile Module**: ZIP archives
- **tarfile Module**: TAR archives
- **Reading Compressed**: Opening .gz, .zip files

### Problem Archetypes

- Read file and count words
- Find most frequent word in file
- Merge sorted files
- Process log files and extract patterns
- Parse CSV and compute statistics
- Convert CSV to JSON
- Find duplicate lines in file
- Split large file into chunks
- Read configuration file
- Search for pattern in multiple files
- Count lines/words/characters in file
- Remove duplicate lines from file
- Reverse lines in file
- Tail -n implementation (last n lines)

### Python-Specific Considerations

- **Always use context manager**: `with open() as f:` ensures cleanup
- **Encoding**: Specify `encoding='utf-8'` for text files
- **Newlines**: `\n` on Unix, `\r\n` on Windows, `newline=''` for CSV
- **Buffering**: Default buffering is usually optimal
- **pathlib.Path**: Modern, object-oriented path handling
- **File position**: `f.seek(0)` to reset to beginning
- **Binary vs Text**: Text mode handles encoding, binary doesn't
- **Generator pattern**: Use for memory efficiency with large files
- **csv.DictReader**: Easier than manual parsing
- **json module**: Built-in, no external dependencies needed

### Interview Tips

- Demonstrate understanding of memory efficiency
- Show proper error handling
- Use context managers consistently
- Explain trade-offs (memory vs speed)
- Consider edge cases (empty files, missing files, large files)
- Know when to use generators vs loading all data
- Understand encoding issues (UTF-8, ASCII, etc.)

---

## 19. System Design Patterns (Coding Interview Context)

### Overview

System design in coding interviews focuses on designing data structures and algorithms for scalable systems. Different from high-level architecture, this covers implementation patterns.

### Sub-topics

#### 19.1 Design Fundamental Data Structures

- **LRU Cache**: Doubly linked list + hash map
  - O(1) get, put operations
  - Eviction policy implementation
  - Capacity management
- **LFU Cache**: Frequency tracking with min-heap or nested maps
  - Frequency buckets
  - Tie-breaking with timestamps
- **Design HashMap**: Hash function, collision handling
  - Separate chaining with linked lists
  - Load factor and rehashing
- **Design HashSet**: Similar to HashMap
- **Min Stack**: Stack with O(1) minimum
  - Auxiliary stack approach
  - Single stack with pairs

#### 19.2 Design Data Stream Structures

- **Moving Average from Data Stream**: Sliding window
  - Queue-based implementation
  - Running sum optimization
- **Find Median from Data Stream**: Two heaps
  - Max-heap for lower half
  - Min-heap for upper half
  - Balancing heaps
- **Streaming Data Processing**: Online algorithms

#### 19.3 Design Iterator Patterns

- **Flatten Nested List Iterator**: Stack-based traversal
  - Lazy evaluation
  - hasNext() and next() implementation
- **Peeking Iterator**: Caching next element
- **Zigzag Iterator**: Multiple lists interleaving
- **Binary Search Tree Iterator**: In-order with O(h) space

#### 19.4 Design Rate Limiters

- **Token Bucket**: Rate limiting with tokens
  - Token generation rate
  - Burst capacity
- **Sliding Window Counter**: Time-window tracking
  - Fixed window issues
  - Sliding window solution
- **Leaky Bucket**: Queue-based rate control

#### 19.5 Design Text/String Systems

- **Design Search Autocomplete**: Trie + ranking
  - Prefix matching
  - Top-k suggestions
  - Weight/frequency tracking
- **Design Spell Checker**: Trie + edit distance
  - Dictionary lookup
  - Suggestion generation
- **Design Text Editor**: Gap buffer or rope
  - Efficient insert/delete
  - Undo/redo with stacks

#### 19.6 Design File Systems

- **In-Memory File System**: Tree structure
  - Directory as map of children
  - Path parsing and navigation
  - File operations (create, read, write)
- **Design Log System**: Time-based storage
  - Efficient retrieval by time range
  - Granularity buckets

#### 19.7 Design Scheduling Systems

- **Task Scheduler**: Priority queue with cooldown
  - Greedy scheduling
  - Frequency tracking
- **Design Job Scheduler**: Priority queue
  - Dependencies handling
  - Deadline management
- **Design Meeting Scheduler**: Interval merging
  - Conflict detection
  - Room allocation

#### 19.8 Design URL Systems

- **URL Shortener (Design TinyURL)**: Hashing/encoding
  - Base62 encoding
  - Counter-based generation
  - Hash collision handling
  - Custom short links
- **URL Parser**: String parsing
  - Protocol, domain, path extraction

#### 19.9 Design Social Network Features

- **Design Twitter**: Timeline generation
  - Tweet storage
  - Follow relationships (graph)
  - Timeline merging (merge k sorted lists)
  - Pull vs push models
- **Design News Feed**: Ranked content delivery
  - Friend posts aggregation
  - Pagination
- **Design Friend Recommendation**: Graph algorithms
  - Common friends
  - Mutual connections

#### 19.10 Design Reservation Systems

- **Design Parking Lot**: Hierarchy of spots
  - Different vehicle types
  - Spot availability tracking
  - Nearest spot finding
- **Design Movie Ticket Booking**: Seat allocation
  - Concurrency handling (locking)
  - Seat hold timeout
- **Design Restaurant Reservation**: Time slot management
  - Table capacity
  - Waitlist queue

#### 19.11 Design Game Systems

- **Design Tic-Tac-Toe**: Board state representation
  - Win condition checking
  - Optimal move detection
- **Design Snake Game**: Queue for snake body
  - Collision detection
  - Food generation
- **Design Leaderboard**: Sorted structure
  - Score updates
  - Rank queries
  - Top-k players

#### 19.12 Design Caching Systems

- **Multi-Level Cache**: L1, L2 cache hierarchy
  - Cache coherence
  - Write-through vs write-back
- **Distributed Cache**: Consistent hashing
  - Key distribution
  - Node addition/removal
- **Cache Invalidation**: TTL, LRU policies

#### 19.13 Design Range Query Structures

- **Range Sum Query**: Prefix sums, segment tree
  - Immutable: prefix sum array
  - Mutable: segment tree or BIT
- **Range Minimum Query**: Sparse table, segment tree
- **Binary Indexed Tree (Fenwick Tree)**: Efficient updates
  - Point update, range query

#### 19.14 Design Undo/Redo Systems

- **Command Pattern**: Stack of operations
  - Execute, undo, redo methods
  - State snapshots
- **Memento Pattern**: Saving states
  - State history stack

#### 19.15 Design Notification Systems

- **Priority-Based Notifications**: Priority queue
  - Urgency levels
  - Batching
- **Rate-Limited Notifications**: Token bucket
  - User preferences

### Problem Archetypes

- LRU Cache
- LFU Cache
- Design HashMap, HashSet
- Min Stack, Max Stack
- Design Twitter
- Design TinyURL
- Design Search Autocomplete System
- Design In-Memory File System
- Design Hit Counter
- Design Tic-Tac-Toe
- Design Snake Game
- Design Parking System
- Implement Trie (Prefix Tree)
- Range Sum Query - Mutable/Immutable
- Find Median from Data Stream
- Design Log Storage System
- Design Underground System

### Key Design Principles

- **Time-Space Tradeoffs**: Cache vs computation
- **Amortized Complexity**: Average performance over operations
- **Lazy Evaluation**: Compute only when needed
- **Precomputation**: Build auxiliary structures
- **Data Structure Selection**: Right tool for requirements
- **API Design**: Clean, intuitive interfaces
- **Edge Cases**: Empty, single element, capacity limits
- **Scalability Considerations**: Growth handling

### Python-Specific Considerations

- **collections.OrderedDict**: For LRU Cache (before Python 3.7)
- **collections.defaultdict**: Simplifies nested structures
- **collections.deque**: Efficient for queues
- **heapq**: For priority queues
- **@property**: For getter methods
- ****init**, **repr**, **str****: Object lifecycle
- **Duck typing**: Interface flexibility
- **Class design**: Single responsibility principle

### Interview Approach

1. **Clarify Requirements**: Ask about scale, operations, constraints
2. **Define API**: What methods need to be supported?
3. **Choose Data Structures**: Based on operation complexity
4. **Consider Tradeoffs**: Time vs space, simplicity vs optimization
5. **Handle Edge Cases**: Empty, single, capacity limits
6. **Discuss Scalability**: How it scales with data
7. **Code Core Operations**: Implement key methods
8. **Test**: Walk through examples

### Common Patterns

- **Hash Map + Doubly Linked List**: LRU Cache
- **Two Heaps**: Median finding
- **Trie**: Prefix-based operations
- **Segment Tree**: Range queries with updates
- **Union-Find**: Connected components
- **Consistent Hashing**: Load distribution
- **Bloom Filter**: Membership testing with false positives

---

## 20. Advanced Topics & Specialized Algorithms

### Overview

Advanced algorithms and specialized techniques for complex problems.

### Sub-topics

#### 20.1 Advanced Graph Algorithms

- **Network Flow**: Max flow, min cut
  - Ford-Fulkerson algorithm
  - Edmonds-Karp (BFS-based)
- **Bipartite Matching**: Hungarian algorithm
- **Tarjan's Algorithm**: Strongly connected components
- **Kosaraju's Algorithm**: SCC alternative
- **Eulerian Path**: Edge traversal
- **Hamiltonian Path**: Vertex traversal

#### 20.2 String Algorithms (Advanced)

- **Suffix Array**: Substring operations
- **Suffix Tree**: Pattern matching, LCP
- **Aho-Corasick**: Multiple pattern matching
- **Manacher's Algorithm**: Longest palindrome O(n)

#### 20.3 Computational Geometry

- **Convex Hull**: Graham scan, Jarvis march
- **Line Intersection**: Sweep line algorithm
- **Closest Pair**: Divide and conquer
- **Point in Polygon**: Ray casting

#### 20.4 Game Theory

- **Minimax**: Optimal game play
- **Alpha-Beta Pruning**: Search optimization
- **Nim Game**: XOR-based strategy
- **Grundy Numbers**: Combinatorial game theory

#### 20.5 Randomized Algorithms

- **Reservoir Sampling**: Random sampling from stream
- **Random Shuffle**: Fisher-Yates algorithm
- **Monte Carlo**: Probabilistic answers
- **Las Vegas**: Always correct, random runtime

#### 20.6 Approximation Algorithms

- **Greedy Approximations**: Near-optimal solutions
- **Vertex Cover**: 2-approximation
- **Set Cover**: Greedy log-approximation
