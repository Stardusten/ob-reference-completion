# ob-reference-completion

一个提供入链、出链补全的插件。

# 解决了什么问题？

添加一个引用时，往往我们脑海中直接出现的并不是要引用的页面名，而是找到这一页面的路径。

# 一个例子

考虑多分类问题：

> Q-Learning 既是一种 Off-Policy RL 也是一种 Active RL。

常见的表达方法有以下两种

1. 使用 MOC：

    ```markdown
    在 Off-Policy RL.md 中:
        - [[Q-Learning]]
	
    在 Active RL.md 中:
        - [[Q-Learning]]
    ```

	![](https://raw.githubusercontent.com/Stardusten/Pic/master/img/202208210706627.gif)

2. 直接链接：

	```markdown
	在 Q-Learning.md 中:
		Q-Learning 既是 [[Off-Policy RL]] 也是 [[Active RL]]
	```

   ![](https://raw.githubusercontent.com/Stardusten/Pic/master/img/202208210713793.gif)
